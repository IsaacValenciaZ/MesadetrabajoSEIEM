import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core'; 
import { CommonModule } from '@angular/common'; 
import { FormsModule } from '@angular/forms'; 
import { ApiService } from '../../services/api';
import Swal from 'sweetalert2';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-supervisor-tickethistory',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './supervisor-tickethistory.html',
  styleUrl: './supervisor-tickethistory.css'
})
export class SupervisorTickethistoryComponent implements OnInit {
  private apiService = inject(ApiService);
  private cdr = inject(ChangeDetectorRef); 

  listaHistorialCompleto: any[] = [];
  listaTicketsFiltrados: any[] = []; // Restaurado
  gruposPorDia: { fecha: string, tickets: any[] }[] = [];
  
  tipoBusqueda: string = 'tecnico'; 
  textoBusqueda: string = '';
  mesesDisponibles: string[] = [];
  mesSeleccionado: string = '';
  
  mostrarCalendario: boolean = false;
  diasCalendario: any[] = [];
  diaSeleccionado: number | null = null;
  cargando: boolean = false;

  ngOnInit() {
    this.solicitarDatosHistorial();
  }

  solicitarDatosHistorial() {
    this.cargando = true;
    this.apiService.getSupervisorDataTickets().subscribe({
      next: (respuestaApi) => {
        this.listaHistorialCompleto = respuestaApi || [];
        this.generarOpcionesMeses();

        const hoy = new Date();
        const mesActualStr = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;
        
        this.mesSeleccionado = this.mesesDisponibles.includes(mesActualStr) ? mesActualStr : (this.mesesDisponibles[0] || '');
        this.diaSeleccionado = hoy.getDate();

        this.aplicarFiltros(false); 
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: () => { this.cargando = false; }
    });
  }

  generarOpcionesMeses() {
    const meses = new Set<string>();
    this.listaHistorialCompleto.forEach(t => { if(t.fecha) meses.add(t.fecha.substring(0, 7)); });
    this.mesesDisponibles = Array.from(meses).sort().reverse();
  }

  aplicarFiltros(reiniciarFiltroDia: boolean = true) {
    if (reiniciarFiltroDia) this.diaSeleccionado = null; 
    
    let resultado = this.mesSeleccionado 
        ? this.listaHistorialCompleto.filter(t => t.fecha && t.fecha.startsWith(this.mesSeleccionado))
        : [...this.listaHistorialCompleto];

    if (this.textoBusqueda.trim() !== '') {
        const txt = this.textoBusqueda.toLowerCase().trim();
        resultado = resultado.filter(t => {
            if (this.tipoBusqueda === 'id') return t.id?.toString().includes(txt);
            if (this.tipoBusqueda === 'tecnico') return (t.personal || '').toLowerCase().includes(txt);
            if (this.tipoBusqueda === 'asignadora') return (t.nombre_creador || '').toLowerCase().includes(txt);
            return true;
        });
    }

    this.listaTicketsFiltrados = resultado; // Mantiene la integridad de tu lógica
    this.construirMatrizCalendario(); 
    
    if (this.diaSeleccionado !== null) {
        const diaPad = this.diaSeleccionado.toString().padStart(2, '0');
        const fechaBusqueda = `${this.mesSeleccionado}-${diaPad}`;
        this.organizarTicketsPorFecha(this.listaTicketsFiltrados.filter(t => t.fecha.startsWith(fechaBusqueda)));
    } else {
        this.organizarTicketsPorFecha(this.listaTicketsFiltrados);
    }
  }

  organizarTicketsPorFecha(lista: any[]) {
    const objetoAgrupador: { [key: string]: any[] } = {};
    lista.forEach(r => {
        const fecha = r.fecha.split(' ')[0];
        if (!objetoAgrupador[fecha]) objetoAgrupador[fecha] = [];
        objetoAgrupador[fecha].push(r);
    });
    this.gruposPorDia = Object.keys(objetoAgrupador)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
      .map(fecha => ({ fecha, tickets: objetoAgrupador[fecha] }));
    this.cdr.detectChanges();
  }

  construirMatrizCalendario() {
    if (!this.mesSeleccionado) return;
    const [año, mes] = this.mesSeleccionado.split('-').map(Number);
    const diasEnMes = new Date(año, mes, 0).getDate();
    const diaInicio = new Date(año, mes - 1, 1).getDay(); 

    this.diasCalendario = [];
    for (let i = 0; i < diaInicio; i++) this.diasCalendario.push({ dia: null, tieneTickets: false });
    
    for (let d = 1; d <= diasEnMes; d++) {
      const fechaC = `${this.mesSeleccionado}-${d.toString().padStart(2, '0')}`;
      const ticketsDelDia = this.listaTicketsFiltrados.filter(t => t.fecha.startsWith(fechaC));
      this.diasCalendario.push({
        dia: d, tieneTickets: ticketsDelDia.length > 0, tickets: ticketsDelDia
      });
    }
  }

  seleccionarDia(diaCalendario: any) {
    if (!diaCalendario.dia) return; 
    this.diaSeleccionado = (this.diaSeleccionado === diaCalendario.dia) ? null : diaCalendario.dia;
    this.mostrarCalendario = false;
    this.aplicarFiltros(false);
  }

  toggleCalendario() { this.mostrarCalendario = !this.mostrarCalendario; }

  obtenerNombreMes(mesAnio: string): string {
    if (!mesAnio) return '';
    const [y, m] = mesAnio.split('-');
    return new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' }).format(new Date(parseInt(y), parseInt(m) - 1));
  }

  abrirModalTicket(ticket: any) {
    const colorFondoCategoria = this.getProblemaColor(ticket.descripcion);
    const colorPrioridad = this.getPrioridadColor(ticket.prioridad);

    const htmlModal = `
      <div style="text-align: left; font-family: 'Segoe UI', sans-serif;">
        <h2 style="color: #56212f; font-weight: 800;">Ticket: #${ticket.id}</h2>
        <p><strong>Solicitante:</strong> ${ticket.nombre_usuario}</p>
        <p><strong>Técnico:</strong> ${ticket.personal || 'Sin asignar'}</p>
        <div style="margin: 15px 0; padding: 10px; border-left: 5px solid ${colorFondoCategoria}; background: #f8fafc;">
          <span style="color:${colorFondoCategoria}; font-weight:700;">${ticket.descripcion}</span> | 
          <span style="color:${colorPrioridad}; font-weight:700;">Prioridad ${ticket.prioridad}</span>
        </div>
        <p style="font-size: 0.9rem; color: #475569;"><strong>Notas:</strong><br>${ticket.notas || 'Sin notas.'}</p>
      </div>
    `;

    Swal.fire({
      html: htmlModal,
      width: '550px',
      showCancelButton: true,
      cancelButtonText: 'Cerrar',
      confirmButtonText: '<span class="material-symbols-outlined" style="vertical-align:middle; margin-right:5px;">visibility</span> Ver Resolución',
      confirmButtonColor: '#56212f',
      showConfirmButton: ticket.estado === 'Completo' || ticket.estado === 'Completado'
    }).then((result) => {
      if (result.isConfirmed) {
        this.verEvidenciaFinal(ticket);
      }
    });
  }

  verEvidenciaFinal(ticket: any) {
    Swal.fire({ title: 'Procesando datos...', didOpen: () => { Swal.showLoading(); } });
    this.apiService.getEvidenciaTicket(ticket.id).subscribe({
      next: (evidencia) => {
        const imagenData = evidencia.evidencia_archivo; 
        const firmaData = evidencia.firma_base64;
        const resolucion = evidencia.descripcion_resolucion || 'Sin descripción detallada.';
        Swal.fire({
          title: `Resolución #${ticket.id}`,
          html: `<div style="text-align: left; padding: 5px;"><p style="font-weight: bold; color: #56212f;">Solución:</p><div style="background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 5px solid #27ae60; margin-bottom: 15px;">${resolucion}</div>${firmaData ? `<div style="text-align:center; background:white; padding:10px; border-radius:8px; border:1px solid #eee; margin-bottom:15px;"><img src="${firmaData}" style="max-height:100px;"></div>` : ''}${imagenData ? `<div style="text-align: center; background: #1a1a1a; padding: 10px; border-radius: 8px;"><img id="img-zoom" src="${imagenData}" style="width: 100%; max-height: 400px; object-fit: contain; cursor: zoom-in;"></div>` : '<p style="text-align:center; color:#999;">Sin evidencia fotográfica.</p>'}</div>`,
          confirmButtonText: 'Cerrar', confirmButtonColor: '#56212f', width: '650px',
          didOpen: () => {
            const img = document.getElementById('img-zoom');
            if (img) img.onclick = () => this.abrirImagenCompleta(imagenData, ticket.id, resolucion);
          }
        });
      },
      error: () => Swal.fire('Error', 'No se pudo cargar la evidencia.', 'error')
    });
  }

  abrirImagenCompleta(imagen: string, id: number, res: string) {
    Swal.fire({
      title: `<span style="color:white;">Evidencia #${id}</span>`,
      html: `<img src="${imagen}" style="max-width:100%; max-height:70vh; border-radius:8px;"><div style="margin-top:15px; text-align:left; color:white; background:rgba(255,255,255,0.1); padding:15px; border-radius:8px; border-left:5px solid #d4a055;">${res}</div>`,
      background: '#000', width: '850px', showConfirmButton: false, showCloseButton: true
    });
  }

  verResumenMensual() { this.lanzarModalGrafica(this.listaTicketsFiltrados, `Métricas de ${this.obtenerNombreMes(this.mesSeleccionado)}`); }
  verEstadisticasDia(grupo: any) { this.lanzarModalGrafica(grupo.tickets, `Resumen: ${grupo.fecha}`); }

  lanzarModalGrafica(tickets: any[], titulo: string) {
    const stats = this.calcularEstadisticas(tickets);
    Swal.fire({
      title: titulo,
      html: `
        <div style="display:flex; justify-content:space-around; flex-wrap:wrap; gap:20px;">
          <div style="width:200px;"><h6 style="font-weight:bold; color:#56212f;">Estatus</h6><canvas id="gEstatus"></canvas></div>
          <div style="width:200px;"><h6 style="font-weight:bold; color:#56212f;">Cumplimiento</h6><canvas id="gPunto"></canvas></div>
        </div>
        <div style="margin-top:20px; background:#f8f9fa; padding:10px; border-radius:10px; border: 1px solid #e2e8f0;">
          <h4 style="color:#56212f; margin:0;">Total: ${stats.total} reportes</h4>
        </div>`,
      width: '650px', showConfirmButton: false,
      didOpen: () => {
        new Chart('gEstatus', { 
          type: 'doughnut', 
          data: { 
            labels: ['Completados', 'En espera', 'Incumplidos'], 
            datasets: [{ data: [stats.completos, stats.enEspera, stats.vencidos], backgroundColor: ['#27ae60', '#f39c12', '#c0392b'] }] 
          } 
        });
        new Chart('gPunto', { 
          type: 'pie', 
          data: { 
            labels: ['A tiempo', 'Atrasado'], 
            datasets: [{ data: [stats.aTiempo, stats.tarde], backgroundColor: ['#2ecc71', '#e67e22'] }] 
          } 
        });
      }
    });
  }

  calcularEstadisticas(lista: any[]) {
    const s = { total: lista.length, completos: 0, vencidos: 0, enEspera: 0, aTiempo: 0, tarde: 0 };
    lista.forEach(t => {
      const estado = t.estado ? t.estado.toLowerCase() : '';
      if (estado === 'completo' || estado === 'completado') {
        s.completos++;
        if (t.fecha_fin && t.fecha_limite) {
          if (t.fecha_fin <= t.fecha_limite) s.aTiempo++; else s.tarde++;
        } else { s.aTiempo++; }
      } 
      else if (estado === 'en espera' || estado === '' || !t.estado) { s.enEspera++; }
      else if (estado === 'incompleto') { s.vencidos++; }
    });
    return s;
  }

  private getProblemaColor(d: string): string { const c:any={'Internet':'#2980b9','Office':'#d35400','Telefonia':'#2c3e50','Tecnico':'#16a085','Dictaminar':'#6c5ce7','Correo':'#96241c'}; return c[d]||'#64748b'; }
  private getPrioridadColor(p: string): string { const c:any={'Alta':'#c0392b','Media':'#f39c12','Baja':'#27ae60'}; return c[p]||'#64748b'; }
}