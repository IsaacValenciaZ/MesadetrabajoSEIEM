                                                                                                                                                                       import { Component, inject, OnInit, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';

import { ViewUserComponent } from './view-user/view-user.component';
import { EditUserComponent } from './edit-user/edit-user.component';
import { DeleteUserComponent } from './delete-user/delete-user.component';
import { CreateUserComponent } from './create-user/create-user.component';
import { PerformanceUserComponent } from './performance-user/performance-user.component';
import { PerformanceSecretariaComponent } from './performance-secretaria/performance-secretaria.component';



@Component({
  selector: 'app-supervisor-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ViewUserComponent,
    EditUserComponent,
    DeleteUserComponent,
    CreateUserComponent,
    PerformanceUserComponent,
    CommonModule,
    PerformanceUserComponent,
    PerformanceSecretariaComponent,
  
  ],
  templateUrl: './supervisor-dashboard.html',
  styleUrls: ['./supervisor-dashboard.css']
})
export class SupervisorDashboardComponent implements OnInit {

  isSidebarOpen: boolean = false;

  http = inject(HttpClient);
  router = inject(Router);
  cdr = inject(ChangeDetectorRef);
  apiUrl = 'http://10.15.10.46/soporteSEIEM/MesadetrabajoSEIEM/backend/get_secretaria_users.php';
  //apiUrl = 'http://localhost/mesatrabajoBACKEND/backend/get_secretaria_users.php';
  usersList: any[] = [];      
  filteredList: any[] = []; 
  currentFilter: string = 'all'; 
  filterTitle: string = 'Listado Completo';
  totalUsers: number = 0;
  countPersonal: number = 0;
  countSecretaria: number = 0;
  countSupervisor: number = 0;

  showView: boolean = false;
  showEdit: boolean = false;
  showDelete: boolean = false;
  showCreate: boolean = false;
  showPerformance: boolean = false;
  showPerformanceSecretaria: boolean = false;
  selectedUser: any = false;
  isControlPersonalOpen: boolean = false;
  usuarioSeleccionado: any = false;
  mostrarListaPersonal: boolean = false;
  usuarioNombre: any;
  menuLateralAbierto: boolean = false;
  ngOnInit() {
    this.cargarDatos();
  }


alternarMenuLateral() {
  this.menuLateralAbierto = !this.menuLateralAbierto;
}

  closeSidebar() {
    this.isSidebarOpen = false;
  }


  toggleControlPersonal() {
    this.isControlPersonalOpen = !this.isControlPersonalOpen;
  }


  cargarDatos() {
    this.http.get<any[]>(this.apiUrl).subscribe({
      next: (data) => {
        console.log("Datos recibidos:", data);
        this.usersList = data;
        this.applyFilter('all');
        this.calcularEstadisticas();
        this.cdr.detectChanges();
      },
      error: (err) => console.error("Error cargando usuarios:", err)
    });
  }

  applyFilter(category: string) {
    this.currentFilter = category;
    if (!this.usersList) return;

    if (category === 'all') {
      this.filteredList = [...this.usersList];
      this.filterTitle = 'Listado Completo';
    } else {
      this.filteredList = this.usersList.filter(user =>
        user.rol && user.rol.toLowerCase() === category.toLowerCase()
      );

      if (category === 'personal') this.filterTitle = 'Listado de Personal';
      if (category === 'supervisor') this.filterTitle = 'Listado de Supervisores';
      if (category === 'secretaria') this.filterTitle = 'Listado de Secretarias';
    }
  }

  calcularEstadisticas() {
    if (!this.usersList) return;
    this.totalUsers = this.usersList.length;

    this.countPersonal = this.usersList.filter(u =>
      u.rol && u.rol.trim().toLowerCase() === 'personal'
    ).length;

    this.countSecretaria = this.usersList.filter(u =>
      u.rol && (u.rol.trim().toLowerCase() === 'secretaria' || u.rol.trim().toLowerCase() === 'secretario')
    ).length;

    this.countSupervisor = this.usersList.filter(u =>
      u.rol && u.rol.trim().toLowerCase() === 'supervisor'
    ).length;
  }


  openViewModal(user: any) { this.selectedUser = { ...user }; this.showView = true; }
  openEditModal(user: any) { this.selectedUser = { ...user }; this.showEdit = true; }
  openDeleteModal(user: any) { this.selectedUser = { ...user }; this.showDelete = true; }
  openCreateModal() { this.showCreate = true; }
  openPerformanceModal(user: any) {
    console.log("Abriendo desempeño para:", user.nombre);
    this.selectedUser = user;
    this.showPerformance = true;
    this.showPerformanceSecretaria = false;
  }

verDesempeno(user: any) {
  this.selectedUser = user;
  this.showPerformance = false; 
  this.showPerformanceSecretaria = true;
}

  closeModals() {
    this.showView = false;
    this.showEdit = false;
    this.showDelete = false;
    this.showCreate = false;
    this.showPerformance = false;
    this.showPerformanceSecretaria = false;
    this.selectedUser = false;
    this.usuarioSeleccionado = null;
   
  }

  handleCreateUser(newUser: any) {
    console.log("Creando usuario:", newUser);
    const tempId = this.usersList.length + 1;
    this.usersList.push({ id: tempId, ...newUser });
    this.calcularEstadisticas();
    this.applyFilter(this.currentFilter);
    this.closeModals();
  }

  logout() {
    localStorage.removeItem('usuario_actual');
    this.router.navigate(['/login']);
  }
}