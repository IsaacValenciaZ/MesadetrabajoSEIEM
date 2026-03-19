import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms'; 
import { ApiService } from '../../services/api'; 
import Swal from 'sweetalert2'; 
import { Chart, registerables } from 'chart.js';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { PerformanceUserComponent } from '../performance-user/performance-user.component'; 
import { PerformanceSecretariaComponent } from '../performance-secretaria/performance-secretaria.component'; 
import { CreateUserComponent } from '../create-user/create-user.component'; 
import { DeleteUserComponent } from '../delete-user/delete-user.component'; 
Chart.register(...registerables);

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

  showReportModal: boolean = false;
  periodoReporte: string = 'semana';
  reportData: any = {};
  reportChart: any;
  priorityChart: any;
  deptChart: any;

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
abrirModalReporte() {
    this.showReportModal = true;
    this.cargarDatosReporte();
  }

  cerrarModalReporte() {
    this.showReportModal = false;
    this.destruirGraficas();
  }

  destruirGraficas() {
    if (this.reportChart) { this.reportChart.destroy(); this.reportChart = null; }
    if (this.priorityChart) { this.priorityChart.destroy(); this.priorityChart = null; }
    if (this.deptChart) { this.deptChart.destroy(); this.deptChart = null; }
  }

  cargarDatosReporte() {
    this.apiService.getReportMetrics(this.periodoReporte).subscribe({
      next: (res: any) => {
        this.reportData = res;
        this.cdr.detectChanges(); 

        setTimeout(() => {
          this.dibujarGraficas();
        }, 300);
      },
      error: () => {
        Swal.fire('Error', 'No se pudieron cargar las estadísticas', 'error');
      }
    });
  }
  
dibujarGraficas() {
  this.destruirGraficas();

  const ctxPie = document.getElementById('reportPieChart') as HTMLCanvasElement;
  if (ctxPie && this.reportData.categorias) {
    const coloresCategorias: { [key: string]: string } = {
      'Internet':           '#2980b9',
      'Office':             '#d35400',
      'Telefonia':          '#2c3e50',
      'Tecnico':            '#16a085',
      'Dictaminar':         '#6c5ce7',
      'Extension/Telefono': '#94961c',
      'Correo':             '#96241c'
    };

    this.reportChart = new Chart(ctxPie, {
      type: 'doughnut',
      data: {
        labels: this.reportData.categorias.map((c: any) => c.nombre),
        datasets: [{
          data: this.reportData.categorias.map((c: any) => c.cantidad),
          backgroundColor: this.reportData.categorias.map((c: any) => 
            coloresCategorias[c.nombre] || '#64748b'
          ),
          borderWidth: 1
        }]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right' } } }
    });
  }

  const ctxPrio = document.getElementById('reportPriorityChart') as HTMLCanvasElement;
  if (ctxPrio && this.reportData.prioridades) {
    const coloresPrioridad: { [key: string]: string } = {
      'Alta':  '#c0392b',
      'Media': '#f39c12',
      'Baja':  '#27ae60'
    };

    this.priorityChart = new Chart(ctxPrio, {
      type: 'pie',
      data: {
        labels: this.reportData.prioridades.map((p: any) => p.nombre),
        datasets: [{
          data: this.reportData.prioridades.map((p: any) => p.cantidad),
          backgroundColor: this.reportData.prioridades.map((p: any) =>
            coloresPrioridad[p.nombre] || '#64748b'
          ),
          borderWidth: 1
        }]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right' } } }
    });
  }

  const ctxDept = document.getElementById('reportDeptChart') as HTMLCanvasElement;
  if (ctxDept && this.reportData.departamentos) {
    this.deptChart = new Chart(ctxDept, {
      type: 'bar',
      data: {
        labels: this.reportData.departamentos.map((d: any) => d.nombre.substring(0, 25)),
        datasets: [{
          label: 'Tickets',
          data: this.reportData.departamentos.map((d: any) => d.cantidad),
          backgroundColor: '#c3b08f',
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
      }
    });
  }
}

  descargarPDF() {
    const data = document.getElementById('pdf-capture-area');
    if (!data) return;

    Swal.fire({
      title: 'Generando PDF...',
      text: 'Por favor espera',
      allowOutsideClick: false,
      didOpen: () => { Swal.showLoading(); }
    });

    html2canvas(data, { scale: 2, useCORS: true }).then(canvas => {
      const imgWidth = 210; 
      let position = 0;    
      const pageHeight = 297;
      
      const imgHeight = canvas.height * imgWidth / canvas.width;
      const contentDataURL = canvas.toDataURL('image/png');

      const pdf = new jsPDF('p', 'mm', 'a4');

      pdf.addImage(contentDataURL, 'PNG', 0, position, imgWidth, imgHeight);
      pdf.save(`Reporte_SEIEM_${this.periodoReporte}.pdf`);
      
      Swal.close();
    }).catch(err => {
      Swal.fire('Error', 'No se pudo generar el PDF', 'error');
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

          Swal.fire({
            icon: 'success',
            title: '¡Cambios Guardados!',
            confirmButtonColor: '#56212f'
          });

          this.cargarDatos();
          this.closeModals();

        } else {

          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: res.message
          });

        }
      },
      error: () => {
        Swal.fire('Error', 'No se pudo conectar con el servidor', 'error');
      }
    });
  }
}
}