import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms'; 
import { ApiService } from '../../services/api'; 
import Swal from 'sweetalert2'; 

import { PerformanceUserComponent } from '../performance-user/performance-user.component'; 
import { PerformanceSecretariaComponent } from '../performance-secretaria/performance-secretaria.component'; 
import { CreateUserComponent } from '../create-user/create-user.component'; 
import { DeleteUserComponent } from '../delete-user/delete-user.component'; 

@Component({
  selector: 'app-gestion-usuarios',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule,
    FormsModule,
    PerformanceUserComponent,
    PerformanceSecretariaComponent,
    CreateUserComponent,
    DeleteUserComponent
  ],
  templateUrl: './gestion-usuarios.html',
  styleUrls: ['./gestion-usuarios.css']
})
export class GestionUsuariosComponent implements OnInit {
  private apiService = inject(ApiService); 
  private cdr = inject(ChangeDetectorRef);

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
  showPerformance: boolean = false; 
  showSecretariaPerf: boolean = false; 
  showCreate: boolean = false;
  showDelete: boolean = false;
  
  selectedUser: any = {}; 

  ngOnInit() {
    this.cargarDatos();
  }

  cargarDatos() {
    this.apiService.getSupervisorUsers().subscribe({
      next: (data) => {
        this.usersList = data || [];
        this.applyFilter(this.currentFilter); 
        this.calcularEstadisticas();
        this.cdr.detectChanges();
      },
      error: (err) => console.error("Error cargando usuarios:", err)
    });
  }

  openDeleteModal(user: any) {
    this.selectedUser = { ...user };
    this.showDelete = true;
    this.cdr.detectChanges();
  }

  openCreateModal() { this.showCreate = true; this.cdr.detectChanges(); }
  openViewModal(user: any) { this.selectedUser = { ...user }; this.showView = true; }
  openPerformance(user: any) {
    this.selectedUser = { ...user };
    const rol = user.rol.toLowerCase();
    if (rol === 'personal') this.showPerformance = true;
    else if (rol === 'secretaria' || rol === 'secretario') this.showSecretariaPerf = true; 
    else Swal.fire('Información', 'Este rol no cuenta con métricas.', 'info');
    this.cdr.detectChanges();
  }
  
  openEditModal(user: any) { 
    this.selectedUser = { ...user }; 
    if (this.selectedUser.rol) {
      const rolNormalizado = this.selectedUser.rol.toLowerCase().trim();
      if (rolNormalizado === 'personal') this.selectedUser.rol = 'Personal';
      else if (rolNormalizado === 'secretaria') this.selectedUser.rol = 'Secretaria';
      else if (rolNormalizado === 'supervisor') this.selectedUser.rol = 'Supervisor';
    }
    this.showEdit = true; 
  }

  closeModals() {
    this.showView = false;
    this.showEdit = false;
    this.showPerformance = false;
    this.showSecretariaPerf = false;
    this.showCreate = false;
    this.showDelete = false; 
    this.selectedUser = {};
    this.cdr.detectChanges();
  }

  onUserDeleted() {
    this.cargarDatos();
    this.closeModals();
  }

  onUserCreated(event: any) {
    this.cargarDatos();
    this.closeModals();
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
    this.countPersonal = this.usersList.filter(u => u.rol && u.rol.trim().toLowerCase() === 'personal').length;
    this.countSecretaria = this.usersList.filter(u => u.rol && (u.rol.trim().toLowerCase() === 'secretaria' || u.rol.trim().toLowerCase() === 'secretario')).length;
    this.countSupervisor = this.usersList.filter(u => u.rol && u.rol.trim().toLowerCase() === 'supervisor').length;
  }

  guardarEdicion() {
    if (this.selectedUser.nombre && this.selectedUser.email && this.selectedUser.rol) {
      this.apiService.updateUser(this.selectedUser).subscribe({
        next: (res: any) => {
          if (res.status) {
            Swal.fire({ icon: 'success', title: '¡Cambios Guardados!', confirmButtonColor: '#56212f' });
            this.cargarDatos(); 
            this.closeModals(); 
          }
        }
      });
    }
  }
}