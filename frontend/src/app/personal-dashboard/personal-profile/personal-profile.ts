import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { ApiService } from '../../services/api';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-personal-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './personal-profile.html',
  styleUrls: ['./personal-profile.css']
})
export class PersonalProfileComponent implements OnInit {

  private apiService = inject(ApiService);
  private detectorCambios = inject(ChangeDetectorRef);

  usuarioActual: any = { nombre: '', email: '' };
  nuevaContrasena = '';
  confirmarContrasena = '';

  etiquetaMesActual = '';
  etiquetaHoy = '';
  anioActual = new Date().getFullYear();

  totalTickets = 0;
  ticketsCompletados = 0;
  ticketsIncompletos = 0;
  porcentajeEficiencia = 0;
  tiempoPromedioTexto = '0h 0m';

  diaTotalTickets = 0;
  diaCompletados = 0;
  diaEnEspera = 0;
  diaIncompletos = 0;
  diaTopCategorias: { nombre: string, cantidad: number }[] = [];

  kpisCalculados = false;
  kpiEspecialidad = '—';
  kpiRanking = 0;
  kpiDepartamento = '—';

  tabActiva: 'dia' | 'mes' | 'anio' = 'mes';

  private todosLosTickets: any[] = [];

  ngOnInit() {
    this.establecerEtiquetas();
    const datosGuardados = localStorage.getItem('usuario_actual');
    if (datosGuardados) {
      this.usuarioActual = JSON.parse(datosGuardados);
      this.obtenerRendimiento();
      this.obtenerEstadoRealDesdeBD();
    }
     setTimeout(() => {
    this.mostrarNovedades();
  }, 500);
  }

  establecerEtiquetas() {
    const hoy = new Date();
    const nombreMes = new Intl.DateTimeFormat('es-ES', { month: 'long' }).format(hoy);
    this.etiquetaMesActual = `${nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1)} ${hoy.getFullYear()}`;
    this.etiquetaHoy = hoy.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
  }

  cambiarTab(tab: 'dia' | 'mes' | 'anio') {
    this.tabActiva = tab;
    this.detectorCambios.detectChanges();
    setTimeout(() => {
      if (tab === 'dia') this.renderizarChartDia();
      if (tab === 'mes') this.generarGraficaGeneral();
      if (tab === 'anio') this.procesarEvolucionAnual();
    }, 50);
  }

obtenerRendimiento() {
  this.apiService.getMisTickets(this.usuarioActual.nombre).subscribe({
    next: (respuesta: any[]) => {
      this.todosLosTickets = respuesta || [];
      this.calcularDia();
      this.calcularMes();
      this.calcularKPIs();
      this.detectorCambios.detectChanges();
      setTimeout(() => {
        this.renderizarChartDia();
        this.generarGraficaGeneral();
        this.procesarEvolucionAnual();
      }, 50);
    },
    error: () => console.error('No se pudo obtener rendimiento')
  });
}

  calcularDia() {
    const hoy = new Date();
    const fechaHoy = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;

    const ticketsHoy = this.todosLosTickets.filter(t => t.fecha && t.fecha.startsWith(fechaHoy));

    this.diaTotalTickets = ticketsHoy.length;
    this.diaCompletados = ticketsHoy.filter(t => t.estado === 'Completo' || t.estado === 'Completado').length;
    this.diaEnEspera = ticketsHoy.filter(t => t.estado === 'En espera' || !t.estado).length;
    this.diaIncompletos = ticketsHoy.filter(t => t.estado === 'Incompleto').length;

    const conteo: any = {};
    ticketsHoy.filter(t => t.estado === 'Completo' || t.estado === 'Completado').forEach(t => {
      conteo[t.descripcion] = (conteo[t.descripcion] || 0) + 1;
    });
    this.diaTopCategorias = Object.keys(conteo)
      .map(k => ({ nombre: k, cantidad: conteo[k] }))
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 4);
  }

  calcularMes() {
    const hoy = new Date();
    const mesFiltro = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;
    const ticketesMes = this.todosLosTickets.filter(t => t.fecha && t.fecha.startsWith(mesFiltro));

    this.totalTickets = ticketesMes.length;
    this.ticketsCompletados = ticketesMes.filter(t => t.estado === 'Completo' || t.estado === 'Completado').length;
    this.ticketsIncompletos = ticketesMes.filter(t => t.estado === 'Incompleto').length;
    this.porcentajeEficiencia = this.totalTickets > 0
      ? Math.round((this.ticketsCompletados / this.totalTickets) * 100) : 0;

    let sumaMinutos = 0;
    let validos = 0;
    ticketesMes.forEach(t => {
      if ((t.estado === 'Completo' || t.estado === 'Completado') && t.fecha && t.fecha_fin) {
        const diff = new Date(t.fecha_fin).getTime() - new Date(t.fecha).getTime();
        if (diff > 0) { sumaMinutos += diff / (1000 * 60); validos++; }
      }
    });
    if (validos > 0) {
      const prom = Math.round(sumaMinutos / validos);
      this.tiempoPromedioTexto = `${Math.floor(prom / 60)}h ${prom % 60}m`;
    }
  }

  calcularKPIs() {
    const hoy = new Date();
    const mesFiltro = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;
    const ticketesMes = this.todosLosTickets.filter(t =>
      t.fecha && t.fecha.startsWith(mesFiltro) && (t.estado === 'Completo' || t.estado === 'Completado')
    );

    const conteoCat: any = {};
    ticketesMes.forEach(t => { conteoCat[t.descripcion] = (conteoCat[t.descripcion] || 0) + 1; });
    const topCat = Object.keys(conteoCat).sort((a, b) => conteoCat[b] - conteoCat[a]);
    this.kpiEspecialidad = topCat.length > 0 ? topCat[0] : '—';

    const conteoDept: any = {};
    ticketesMes.forEach(t => { conteoDept[t.departamento] = (conteoDept[t.departamento] || 0) + 1; });
    const topDept = Object.keys(conteoDept).sort((a, b) => conteoDept[b] - conteoDept[a]);
    this.kpiDepartamento = topDept[0].length > 30 
  ? topDept[0].substring(0, 30) + '...' 
  : topDept[0];

this.kpiRanking = this.diaTotalTickets > 0
  ? Math.round((this.diaCompletados / this.diaTotalTickets) * 100)
  : 0;

    this.kpisCalculados = true;
  }

  renderizarChartDia() {
    const lienzo = document.getElementById('chartDia') as HTMLCanvasElement;
    if (!lienzo) return;
    const prev = Chart.getChart(lienzo);
    if (prev) prev.destroy();

    new Chart(lienzo, {
      type: 'doughnut',
      data: {
        labels: ['Completados', 'En Espera'],
        datasets: [{
          data: [this.diaCompletados, this.diaEnEspera],
          backgroundColor: ['#22c55e', '#f59e0b'],
          borderWidth: 0,
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false, cutout: '75%',
        plugins: { legend: { display: false } }
      }
    });
  }

  generarGraficaGeneral() {
    const lienzo = document.getElementById('chartMes') as HTMLCanvasElement;
    if (!lienzo) return;
    const prev = Chart.getChart(lienzo);
    if (prev) prev.destroy();

    new Chart(lienzo, {
      type: 'doughnut',
      data: {
labels: ['Completados', 'En Espera', 'Incompletos'],  
      datasets: [{
        data: [this.ticketsCompletados, this.totalTickets - this.ticketsCompletados - this.ticketsIncompletos, this.ticketsIncompletos],  
        backgroundColor: ['#22c55e', '#f59e0b', '#ef4444'],
        borderWidth: 0,
        hoverOffset: 4
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false, cutout: '75%',
        plugins: { legend: { display: false } }
      }
    });
  }

  procesarEvolucionAnual() {
    const anio = new Date().getFullYear();
    const meses = Array.from({ length: 12 }, (_, i) => {
      const m = String(i + 1).padStart(2, '0');
      return `${anio}-${m}`;
    });

    const etiquetas = meses.map(m => {
      const d = new Date(m + '-02');
      return new Intl.DateTimeFormat('es-ES', { month: 'short' }).format(d);
    });

    const completadosPorMes = meses.map(m =>
      this.todosLosTickets.filter(t =>
        t.fecha && t.fecha.startsWith(m) && (t.estado === 'Completo' || t.estado === 'Completado')
      ).length
    );

    const lienzo = document.getElementById('monthlyChart') as HTMLCanvasElement;
    if (!lienzo) return;
    const prev = Chart.getChart(lienzo);
    if (prev) prev.destroy();

    new Chart(lienzo, {
      type: 'line',
      data: {
        labels: etiquetas,
        datasets: [{
          label: 'Completados',
          data: completadosPorMes,
          borderColor: '#56212f',
          backgroundColor: 'rgba(86,33,47,0.1)',
          borderWidth: 3,
          pointBackgroundColor: '#fff',
          pointBorderColor: '#56212f',
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        scales: {
          y: { beginAtZero: true, ticks: { stepSize: 1 }, grid: { color: '#f1f5f9' } },
          x: { grid: { display: false } }
        },
        plugins: { legend: { display: false } }
      }
    });
  }

  guardarCambiosPerfil() {
    if (!this.usuarioActual.nombre || !this.usuarioActual.email) {
      Swal.fire({ title: 'Campos requeridos', text: 'Asegúrate de llenar tu nombre y correo', icon: 'warning' });
      return;
    }
    const datosFormulario = {
      id: this.usuarioActual.id,
      nombre: this.usuarioActual.nombre,
      email: this.usuarioActual.email,
      password: this.nuevaContrasena
    };
    this.apiService.updateProfile(datosFormulario).subscribe({
      next: (res: any) => {
        if (res.status) {
          const sesion = localStorage.getItem('usuario_actual');
          if (sesion) {
            let perfil = JSON.parse(sesion);
            perfil.nombre = this.usuarioActual.nombre;
            perfil.email = this.usuarioActual.email;
            localStorage.setItem('usuario_actual', JSON.stringify(perfil));
          }
          Swal.fire({ icon: 'success', title: 'Perfil actualizado', confirmButtonColor: '#56212f' })
            .then(() => window.location.reload());
        } else {
          Swal.fire({ title: 'No se pudo actualizar', text: res.message, icon: 'error' });
        }
      },
      error: () => Swal.fire({ title: 'Error de conexión', icon: 'error' })
    });
  }

  cambiarMiEstado() {
    if (!this.usuarioActual.estado_disponibilidad) this.usuarioActual.estado_disponibilidad = 'disponible';
    this.apiService.actualizarEstadoDisponibilidad({ id: this.usuarioActual.id, estado: this.usuarioActual.estado_disponibilidad }).subscribe({
      next: (res: any) => {
        if (res.status) {
          localStorage.setItem('usuario_actual', JSON.stringify(this.usuarioActual));
          Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 2000 })
            .fire({ icon: 'success', title: 'Estado actualizado' });
        } else {
          Swal.fire('Error', res.message || 'No se pudo cambiar el estado', 'error');
        }
      },
      error: () => Swal.fire('Error', 'No se pudo conectar con el servidor', 'error')
    });
  }

  obtenerEstadoRealDesdeBD() {
    this.apiService.getUsers().subscribe({
      next: (usuarios: any[]) => {
        const yo = usuarios.find(u => u.id === this.usuarioActual.id);
        if (yo) {
          this.usuarioActual.estado_disponibilidad = yo.estado_disponibilidad || 'disponible';
          localStorage.setItem('usuario_actual', JSON.stringify(this.usuarioActual));
          this.detectorCambios.detectChanges();
        }
      },
      error: () => console.error('No se pudo verificar el estado')
    });
  }

  mostrarNovedades() {
  const claveVista = 'novedad_firma_v3';

  if (localStorage.getItem(claveVista)) return;

  Swal.fire({
    title: '',
    html: `
      <div style="text-align: left; font-family: 'Segoe UI', sans-serif; padding: 4px 0;">

        <!-- Header -->
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
          <span class="material-symbols-outlined" style="color: #56212f; font-size: 1.4rem;">new_releases</span>
          <div>
            <p style="margin: 0; font-size: 0.65rem; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8;">Actualización</p>
            <h3 style="margin: 0; font-size: 1rem; font-weight: 700; color: #0f172a;">Nuevas funciones disponibles</h3>
          </div>
        </div>

        <!-- Descripción -->
        <p style="margin: 0 0 16px 0; font-size: 0.8rem; color: #64748b; line-height: 1.5; padding-left: 2px;">
          Se han agregado mejoras en la captura de firma y en la visualización de tu desempeño.
        </p>

        <!-- Items -->
        <div style="display: flex; flex-direction: column; gap: 1px; border-radius: 10px; overflow: hidden; border: 1px solid #f1f5f9; margin-bottom: 16px;">

          <div style="display: flex; align-items: flex-start; gap: 14px; padding: 14px 16px; background: #fafafa;">
            <span class="material-symbols-outlined" style="color: #56212f; font-size: 1.2rem; flex-shrink: 0; margin-top: 1px;">stylus_note</span>
            <div>
              <p style="margin: 0; font-weight: 700; color: #1e293b; font-size: 0.85rem;">Firma en pantalla completa (móvil)</p>
              <p style="margin: 3px 0 0 0; color: #64748b; font-size: 0.8rem; line-height: 1.5;">
                Al cerrar un ticket en móvil, toca el área de firma para abrirla en pantalla completa y evitar rayones accidentales al guardar.
              </p>
            </div>
          </div>

          <div style="height: 1px; background: #f1f5f9;"></div>

          <div style="display: flex; align-items: flex-start; gap: 14px; padding: 14px 16px; background: #fafafa;">
            <span class="material-symbols-outlined" style="color: #56212f; font-size: 1.2rem; flex-shrink: 0; margin-top: 1px;">computer</span>
            <div>
              <p style="margin: 0; font-weight: 700; color: #1e293b; font-size: 0.85rem;">Firma directa en desktop</p>
              <p style="margin: 3px 0 0 0; color: #64748b; font-size: 0.8rem; line-height: 1.5;">
                En computadora puedes firmar directamente en el área del modal como siempre.
              </p>
            </div>
          </div>

          <div style="height: 1px; background: #f1f5f9;"></div>

          <div style="display: flex; align-items: flex-start; gap: 14px; padding: 14px 16px; background: #fafafa;">
            <span class="material-symbols-outlined" style="color: #56212f; font-size: 1.2rem; flex-shrink: 0; margin-top: 1px;">bar_chart</span>
            <div>
              <p style="margin: 0; font-weight: 700; color: #1e293b; font-size: 0.85rem;">Métricas de desempeño renovadas</p>
              <p style="margin: 3px 0 0 0; color: #64748b; font-size: 0.8rem; line-height: 1.5;">
                Tu perfil ahora muestra métricas divididas por <strong>día</strong>, <strong>mes</strong> y <strong>año</strong>, junto con KPIs como tu especialidad principal, ranking anónimo y el departamento que más has ayudado.
              </p>
            </div>
          </div>

        </div>

        <!-- Nota -->
        <div style="display: flex; align-items: flex-start; gap: 10px; padding: 12px 14px; background: rgba(86,33,47,0.04); border-radius: 8px; border-left: 2px solid #56212f;">
          <span class="material-symbols-outlined" style="color: #56212f; font-size: 1rem; flex-shrink: 0; margin-top: 1px;">info</span>
          <p style="margin: 0; font-size: 0.78rem; color: #56212f; line-height: 1.5;">
            Si el solicitante no está presente al cerrar un ticket, marca <strong>"Cerrar ticket sin firma"</strong> para cerrarlo igualmente.
          </p>
        </div>

      </div>
    `,
    confirmButtonText: 'Entendido',
    confirmButtonColor: '#56212f',
    width: window.innerWidth < 600 ? '92vw' : '480px',
  }).then(() => {
    localStorage.setItem(claveVista, 'true');
  });
}
}