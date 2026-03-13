import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api';
import { PerformanceUserComponent } from '../performance-user/performance-user.component'; 
import { PerformanceSecretariaComponent } from '../performance-secretaria/performance-secretaria.component'; 

@Component({
  selector: 'app-supervisor-metrics',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
    PerformanceUserComponent,
    PerformanceSecretariaComponent
  ],
  templateUrl: './supervisor-metrics.html',
  styleUrls: ['./supervisor-metrics.css']
})
export class SupervisorMetricsComponent implements OnInit {
  private apiService = inject(ApiService);
  private cdr = inject(ChangeDetectorRef);

  allTickets: any[] = [];
  allUsers: any[] = [];

  totalTicketsMes: number = 0;
  resueltosMes: number = 0;
  pendientesMes: number = 0;
  eficienciaMes: string = '0';

  topTecnicos: any[] = [];
  tecnicosAtrasados: any[] = [];
  topSecretarias: any[] = [];
  
  listaPersonal: any[] = [];

  selectedUser: any = null;
  showPerformance: boolean = false;
  showSecretariaPerf: boolean = false;

  mesActualNombre: string = '';

  ngOnInit() {
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    this.mesActualNombre = meses[new Date().getMonth()];
    this.cargarDatosMultiples();
  }

  cargarDatosMultiples() {
    this.apiService.getSupervisorUsers().subscribe({
      next: (users) => {
        this.allUsers = users || [];
        this.listaPersonal = [...this.allUsers].filter(u => u.rol !== 'Admin' && u.rol !== 'Supervisor');
        
        this.apiService.getSupervisorDataTickets().subscribe({
          next: (tickets) => {
            this.allTickets = tickets || [];
            this.calcularMetricas();
          }
        });
      }
    });
  }

  calcularMetricas() {
    const now = new Date();
    const mesActual = now.getMonth();
    const anioActual = now.getFullYear();

    const ticketsDelMes = this.allTickets.filter(t => {
      if (!t.fecha) return false;
      const f = new Date(t.fecha);
      return f.getMonth() === mesActual && f.getFullYear() === anioActual;
    });

    this.totalTicketsMes = ticketsDelMes.length;
    const completadosMes = ticketsDelMes.filter(t => t.estado?.toLowerCase() === 'completo' || t.estado?.toLowerCase() === 'completado');
    const pendientesDelMes = ticketsDelMes.filter(t => t.estado?.toLowerCase() !== 'completo' && t.estado?.toLowerCase() !== 'completado');
    
    this.resueltosMes = completadosMes.length;
    this.pendientesMes = pendientesDelMes.length;
    this.eficienciaMes = this.totalTicketsMes > 0 ? ((this.resueltosMes / this.totalTicketsMes) * 100).toFixed(1) : '0';

    const conteoTecnicos: { [key: string]: number } = {};
    completadosMes.forEach(t => {
      if (t.personal && t.personal.trim() !== '') {
        conteoTecnicos[t.personal] = (conteoTecnicos[t.personal] || 0) + 1;
      }
    });
    this.topTecnicos = Object.keys(conteoTecnicos)
      .map(k => ({ nombre: k, cantidad: conteoTecnicos[k] }))
      .sort((a, b) => b.cantidad - a.cantidad).slice(0, 5);

    const todosPendientes = this.allTickets.filter(t => t.estado?.toLowerCase() !== 'completo' && t.estado?.toLowerCase() !== 'completado');
    const conteoAtrasos: { [key: string]: number } = {};
    todosPendientes.forEach(t => {
      if (t.personal && t.personal.trim() !== '') {
        conteoAtrasos[t.personal] = (conteoAtrasos[t.personal] || 0) + 1;
      }
    });
    this.tecnicosAtrasados = Object.keys(conteoAtrasos)
      .map(k => ({ nombre: k, cantidad: conteoAtrasos[k] }))
      .sort((a, b) => b.cantidad - a.cantidad).slice(0, 5);

    const conteoSec: { [key: string]: number } = {};
    ticketsDelMes.forEach(t => {
      const nombreSec = t.nombre_creador; 
      
      if (nombreSec && nombreSec.trim() !== '') {
        conteoSec[nombreSec.trim()] = (conteoSec[nombreSec.trim()] || 0) + 1;
      }
    });

    this.topSecretarias = Object.keys(conteoSec)
      .map(k => ({ nombre: k, cantidad: conteoSec[k] }))
      .sort((a, b) => b.cantidad - a.cantidad).slice(0, 5);

    this.listaPersonal = this.listaPersonal.map(u => {
      if (u.rol.toLowerCase() === 'personal') {
        u.metric1 = conteoTecnicos[u.nombre] || 0; 
        u.metric2 = conteoAtrasos[u.nombre] || 0;
      } else {
        u.metric1 = conteoSec[u.nombre] || 0; 
        u.metric2 = '-'; 
      }
      return u;
    });

    this.cdr.detectChanges();
  }

  abrirRendimientoIndividual(user: any) {
    this.selectedUser = { ...user };
    const rol = user.rol?.toLowerCase();
    
    if (rol === 'personal') {
      this.showPerformance = true;
    } else if (rol === 'secretaria' || rol === 'secretario') {
      this.showSecretariaPerf = true;
    }
  }

  cerrarModales() {
    this.showPerformance = false;
    this.showSecretariaPerf = false;
    this.selectedUser = null;
  }
}