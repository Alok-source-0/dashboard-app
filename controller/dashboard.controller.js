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
            // Net Revenue = Revenue - Return (Assuming Return is stored as a positive value for deduction)
            // If parseNumber already returned a negative value for Return (e.g. from '(100)'), we should add it.
            // However, based on user feedback "everything is in +ve", we assume inputs are positive.
            doc.net_revenue = doc.revenue - Math.abs(doc.return);
            
            if (doc.net_revenue !== 0) {
                doc.percentage = doc.spent / doc.net_revenue;
            } else {
                doc.percentage = 0;
            }
            return doc;
        });

        if (finalDocs.length > 0) {
            // Clear existing data to ensure dashboard only reflects the new file
            await Financial.deleteMany({});
            
            // Insert new data
            await Financial.insertMany(finalDocs);
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
        console.log(`Data fetch request. Query: ${JSON.stringify(query)}, Found: ${data.length} records`);
        res.status(200).json(data);
    } catch (error) {
        console.error("Error fetching data:", error);
        res.status(500).json({ message: "Error fetching data", error: error.message });
    }
};

const OpenAI = require('openai');

const getYears = async (req, res) => {
    try {
        const years = await Financial.distinct('year');
        res.status(200).json(years);
    } catch (error) {
        res.status(500).json({ message: "Error fetching years", error: error.message });
    }
};

const getSummary = async (req, res) => {
    try {
        const { year } = req.body;
        const query = {};
        if (year && year !== 'All') query.year = year;
        
        const data = await Financial.find(query);
        
        if (!data || data.length === 0) {
            return res.status(200).json({ summary: "No data available to summarize." });
        }

        // Prepare data for summary
        const totalRevenue = data.reduce((acc, curr) => acc + curr.net_revenue, 0);
        const totalSpend = data.reduce((acc, curr) => acc + curr.spent, 0);
        const avgPercentage = totalSpend / totalRevenue || 0;
        
        // Find highest revenue month
        const bestMonth = data.reduce((max, curr) => curr.net_revenue > max.net_revenue ? curr : max, data[0]);

        const context = `Financial Data Summary for ${year || 'All Years'}:
        Total Net Revenue: ${totalRevenue.toFixed(2)}
        Total Spend: ${totalSpend.toFixed(2)}
        Spend/Revenue Percentage: ${(avgPercentage * 100).toFixed(2)}%
        Best Month: ${bestMonth.month} ${bestMonth.year} (${bestMonth.net_revenue})
        Data points: ${data.length}
        `;

        // Check for OpenAI key
        if (process.env.OPENAI_API_KEY) {
            const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
            const completion = await openai.chat.completions.create({
                messages: [
                    { role: "system", content: "You are a financial analyst. Provide a concise executive summary of the provided financial data insights. Highlight trends and key performance indicators." },
                    { role: "user", content: context }
                ],
                model: "gpt-3.5-turbo",
            });
            return res.status(200).json({ summary: completion.choices[0].message.content });
        }

        // Fallback Heuristic Analysis
        const summary = `Automated Analysis (AI Model Not Configured):
        
        Over the selected period (${year || 'All Years'}), the total net revenue generated was ${totalRevenue.toLocaleString(undefined, {minimumFractionDigits: 2})}.
        The total spend/burn was ${totalSpend.toLocaleString(undefined, {minimumFractionDigits: 2})}.
        
        Key Metrics:
        - Overall Spend-to-Revenue Ratio: ${(avgPercentage * 100).toFixed(2)}%
        - Best Performing Month: ${bestMonth.month} ${bestMonth.year} with revenue of ${bestMonth.net_revenue.toLocaleString()}
        
        ${avgPercentage > 0.4 ? "Observation: Marketing spend is relatively high (>40%). Consider optimizing acquisition costs." : "Observation: Healthy margins indicated with spend below 40%."}`;

        res.status(200).json({ summary: summary });

    } catch (error) {
        console.error("Summary error:", error);
        res.status(500).json({ message: "Error generating summary", error: error.message });
    }
};

module.exports = {
    upload,
    uploadCsv,
    getData,
    getYears,
    getSummary
};
