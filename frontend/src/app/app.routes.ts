import { Routes } from '@angular/router';
import { LoginComponent } from './login/login';

//secretaria
import { SecretariaDashboardComponent } from './secretaria-dashboard/secretaria-dashboard';
import { UsersListComponent } from './secretaria-dashboard/users-list/users-list';
import { TicketsComponent } from './secretaria-dashboard/tickets/tickets';
import { TicketsListComponent } from './secretaria-dashboard/tickets-list/tickets-list';
import { UserProfileComponent } from './secretaria-dashboard/user-profile/user-profile';

//Supervisor
import { SupervisorDashboardComponent } from './supervisor-dashboard/supervisor-dashboard';
import { GestionUsuariosComponent } from './supervisor-dashboard/gestion-usuarios/gestion-usuarios';
import { SupervisorStartComponent } from './supervisor-dashboard/supervisor-start/supervisor-start';
import { SupervisorTickethistoryComponent } from './supervisor-dashboard/supervisor-tickethistory/supervisor-tickethistory';

//personal
import { PersonalDashboardComponent } from './personal-dashboard/personal-dashboard';
import { PersonalPendingComponent } from './personal-dashboard/personal-pending/personal-pending';
import { PersonalHistoryComponent } from './personal-dashboard/personal-history/personal-history';
import { PersonalProfileComponent } from './personal-dashboard/personal-profile/personal-profile';

import { authGuard } from './auth.guard';


export const routes: Routes = [
    { path: '', redirectTo: '/login', pathMatch: 'full' },

    { path: 'login', component: LoginComponent },

    {
        path: 'secretaria',
        component: SecretariaDashboardComponent,
        canActivate: [authGuard],
        children: [
        { path: '', redirectTo: 'tickets', pathMatch: 'full' }, 
         { path: 'tickets', component: TicketsComponent },
              { path: 'usuarios', component: UsersListComponent },
        { path: 'tickets-list', component: TicketsListComponent },
        { path: 'perfil', component: UserProfileComponent }
        ]
    },

    {
        path: 'supervisor',
        component: SupervisorDashboardComponent,
        children: [
             { path: '', redirectTo: 'inicio', pathMatch: 'full' }, 
             { path: 'inicio', component: SupervisorStartComponent },
            { path: 'gestion-usuarios', component: GestionUsuariosComponent },
            { path: 'historial-tickets', component: SupervisorTickethistoryComponent },

        ]
    },

    {
        path: 'personal',
        component: PersonalDashboardComponent,
        children: [
            { path: '', redirectTo: 'mis-reportes', pathMatch: 'full' },
            { path: 'mis-reportes', component: PersonalPendingComponent },
            { path: 'historial', component: PersonalHistoryComponent },
            { path: 'perfil', component: PersonalProfileComponent },
        ]
    },
];

