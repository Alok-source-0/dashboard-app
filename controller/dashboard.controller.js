const multer = require('multer');
const fs = require('fs');
const XLSX = require('xlsx');
const Financial = require('../models/financial');

const upload = multer({ dest: 'uploads/' });

const parseNumber = (input) => {
    if (input === null || input === undefined) return 0;
    if (typeof input === 'number') return input;
    
    let str = input.toString().trim();
    if (str === '-' || str === '') return 0;
    
    let isNegative = false;
    if (str.startsWith('(') && str.endsWith(')')) {
        isNegative = true;
        str = str.substring(1, str.length - 1);
    }
    str = str.replace(/,/g, '');
    let val = parseFloat(str);
    if (isNaN(val)) return 0;
    return isNegative ? -val : val;
};

const uploadCsv = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
    }

    try {
        // Read file using XLSX
        const workbook = XLSX.readFile(req.file.path);
        // Assume first sheet
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        // Convert to array of arrays
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

        const results = [];
        let currentYear = '';
        let monthMap = {}; 
        let dataStore = {}; 

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            // Safe access to first column
            const col0 = row[0] ? row[0].toString().trim() : '';

            if (col0.startsWith('F.Y.')) {
                currentYear = col0;
                monthMap = {}; 
                continue;
            }

            if (col0.includes('Online')) {
                // row is an array. define month map based on index
                row.forEach((val, index) => {
                    const cleanVal = val ? val.toString().trim() : '';
                    if (index !== 0 && cleanVal && !cleanVal.toLowerCase().includes('total')) {
                        monthMap[index] = cleanVal;
                    }
                });
                continue;
            }

            if (currentYear) {
                const isWebsite = col0 === 'Website';
                const isReturn = col0 === 'Website Return';
                const isSpend = col0.includes('Spends/Burn');

                if (isWebsite || isReturn || isSpend) {
                    Object.keys(monthMap).forEach(colIndex => {
                        const monthName = monthMap[colIndex];
                        const key = `${currentYear}_${monthName}`;      

                        if (!dataStore[key]) {
                            dataStore[key] = {
                                year: currentYear,
                                month: monthName,
                                revenue: 0,
                                return: 0,
                                spent: 0,
                                net_revenue: 0,
                                percentage: 0
                            };
                        }

                        // Access data by column index
                        const rawVal = row[colIndex];
                        const val = parseNumber(rawVal);

                        if (isWebsite) {
                            dataStore[key].revenue = val;
                        } else if (isReturn) {
                            dataStore[key].return = val;
                        } else if (isSpend) {
                            dataStore[key].spent = val;
                        }
                    });
                }
            }
        }

        // Post-process
        const finalDocs = Object.values(dataStore).map(doc => {
            doc.net_revenue = doc.revenue + doc.return;
            if (doc.net_revenue !== 0) {
                doc.percentage = doc.spent / doc.net_revenue;
            } else {
                doc.percentage = 0;
            }
            return doc;
        });

        if (finalDocs.length > 0) {
            const operations = finalDocs.map(doc => ({
                updateOne: {
                    filter: { year: doc.year, month: doc.month },       
                    update: { $set: doc },
                    upsert: true
                }
            }));
            await Financial.bulkWrite(operations);
        }

        res.status(200).json({
            message: "File imported and processed successfully",
            count: finalDocs.length,
            data: finalDocs
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error processing file", error: error.message });
    } finally {
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
    }
};

const getData = async (req, res) => {
    try {
        const { year, month } = req.query;
        const query = {};
        if (year) query.year = year;
        if (month) query.month = month;
        
        const data = await Financial.find(query);
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ message: "Error fetching data", error: error.message });
    }
};

const getYears = async (req, res) => {
    try {
        const years = await Financial.distinct('year');
        res.status(200).json(years);
    } catch (error) {
        res.status(500).json({ message: "Error fetching years", error: error.message });
    }
};

module.exports = {
    upload,
    uploadCsv,
    getData,
    getYears
};
