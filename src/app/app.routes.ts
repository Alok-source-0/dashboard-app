import { Routes } from '@angular/router';
import { DashboardComponent } from './dashboard.component';
import { LoginComponent } from './login/login.component';
import { ProfileComponent } from './profile/profile.component';
import { AdminComponent } from './admin/admin.component';
import { inject } from '@angular/core';
import { AuthService } from './services/auth.service';

const authGuard = () => {
    const auth = inject(AuthService);
    return auth.isLoggedIn() || (inject(AuthService).checkSession(), auth.isLoggedIn());
};

const adminGuard = () => {
    const auth = inject(AuthService);
    const loggedIn = auth.isLoggedIn() || (inject(AuthService).checkSession(), auth.isLoggedIn());
    return loggedIn && auth.user()?.role === 'admin';
};

export const routes: Routes = [
    { path: '', component: DashboardComponent, canActivate: [authGuard] },
    { path: 'login', component: LoginComponent },
    { path: 'profile', component: ProfileComponent, canActivate: [authGuard] },
    { path: 'admin', component: AdminComponent, canActivate: [adminGuard] },
    { path: '**', redirectTo: '' }
];
