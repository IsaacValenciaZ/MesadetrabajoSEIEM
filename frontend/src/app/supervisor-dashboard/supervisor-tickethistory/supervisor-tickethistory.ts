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
      },
      error: () => { 
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  generarOpcionesMeses() {
    const meses = new Set<string>();
    for (let i = 0; i < this.listaHistorialCompleto.length; i++) {
      const f = this.listaHistorialCompleto[i].fecha;
      if (f) meses.add(f.substring(0, 7));
    }
    this.mesesDisponibles = Array.from(meses).sort().reverse();
  }

  aplicarFiltros(reiniciarFiltroDia: boolean = true) {
    if (reiniciarFiltroDia) this.diaSeleccionado = null; 
    
    const busqueda = this.textoBusqueda.toLowerCase().trim();
    const diaPad = this.diaSeleccionado ? this.diaSeleccionado.toString().padStart(2, '0') : null;
    const fechaCompletaFiltro = diaPad ? `${this.mesSeleccionado}-${diaPad}` : this.mesSeleccionado;

    const ticketsFiltrados = this.listaHistorialCompleto.filter(t => {
      if (!t.fecha || !t.fecha.startsWith(fechaCompletaFiltro)) return false;
      
      if (busqueda !== '') {
        if (this.tipoBusqueda === 'id') return t.id?.toString().includes(busqueda);
        if (this.tipoBusqueda === 'tecnico') return (t.personal || '').toLowerCase().includes(busqueda);
        if (this.tipoBusqueda === 'asignadora') return (t.nombre_creador || '').toLowerCase().includes(busqueda);
      }
      return true;
    });

    this.organizarTicketsPorFecha(ticketsFiltrados);
    if (this.mostrarCalendario) this.construirMatrizCalendario();
  }

  organizarTicketsPorFecha(lista: any[]) {
    const objetoAgrupador: Map<string, any[]> = new Map();
    
    for (let i = 0; i < lista.length; i++) {
      const fecha = lista[i].fecha.split(' ')[0];
      if (!objetoAgrupador.has(fecha)) objetoAgrupador.set(fecha, []);
      objetoAgrupador.get(fecha)!.push(lista[i]);
    }

    this.gruposPorDia = Array.from(objetoAgrupador.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([fecha, tickets]) => ({ fecha, tickets }));
    
    this.cdr.detectChanges();
  }

  construirMatrizCalendario() {
    if (!this.mesSeleccionado) return;
    const [año, mes] = this.mesSeleccionado.split('-').map(Number);
    const diaInicio = new Date(año, mes - 1, 1).getDay(); 
    const diasEnMes = new Date(año, mes, 0).getDate();

    this.diasCalendario = Array(diaInicio).fill({ dia: null, tieneTickets: false });
    
    const fechasConTickets = new Set(
      this.listaHistorialCompleto
        .filter(t => t.fecha && t.fecha.startsWith(this.mesSeleccionado))
        .map(t => t.fecha.substring(0, 10))
    );

    for (let d = 1; d <= diasEnMes; d++) {
      const fechaC = `${this.mesSeleccionado}-${d.toString().padStart(2, '0')}`;
      this.diasCalendario.push({
        dia: d, 
        tieneTickets: fechasConTickets.has(fechaC)
      });
    }
  }

  seleccionarDia(diaCalendario: any) {
    if (!diaCalendario.dia) return; 
    this.diaSeleccionado = (this.diaSeleccionado === diaCalendario.dia) ? null : diaCalendario.dia;
    this.mostrarCalendario = false;
    this.aplicarFiltros(false);
  }

  toggleCalendario() { 
    this.mostrarCalendario = !this.mostrarCalendario; 
    if (this.mostrarCalendario) this.construirMatrizCalendario();
  }

  obtenerNombreMes(mesAnio: string): string {
    if (!mesAnio) return '';
    const [y, m] = mesAnio.split('-');
    return new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' }).format(new Date(parseInt(y), parseInt(m) - 1));
  }

  verResumenMensual() { 
    const ticketsMes = this.listaHistorialCompleto.filter(t => t.fecha && t.fecha.startsWith(this.mesSeleccionado));
    this.lanzarModalGrafica(ticketsMes, `Análisis de ${this.obtenerNombreMes(this.mesSeleccionado)}`); 
  }

  verEstadisticasDia(grupo: any) { 
    this.lanzarModalGrafica(grupo.tickets, `Reporte: ${grupo.fecha}`); 
  }

  lanzarModalGrafica(tickets: any[], titulo: string) {
    const stats = this.calcularEstadisticas(tickets);
    Swal.fire({
      title: titulo,
      html: `
        <div style="display:flex; justify-content:space-around; flex-wrap:wrap; gap:20px;">
          <div style="width:200px;"><h6>Estatus</h6><canvas id="gEstatus"></canvas></div>
          <div style="width:200px;"><h6>Cumplimiento</h6><canvas id="gPunto"></canvas></div>
        </div>
        <div style="margin-top:20px; background:#f8f9fa; padding:10px; border-radius:10px;">
          <h4 style="color:#56212f; margin:0;">Total: ${stats.total} reportes</h4>
        </div>`,
      width: '650px', showConfirmButton: false,
      didOpen: () => {
        new Chart('gEstatus', { 
          type: 'doughnut', 
          data: { 
            labels: ['Completados', 'En espera', 'Incumplidos'], 
            datasets: [{ data: [stats.completos, stats.enEspera, stats.vencidos], backgroundColor: ['#27ae60', '#8a772d', '#c0392b'] }] 
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
    for (let i = 0; i < lista.length; i++) {
      const t = lista[i];
      const estado = (t.estado || '').toLowerCase();
      if (estado === 'completo' || estado === 'completado') {
        s.completos++;
        if (t.fecha_fin && t.fecha_limite) {
          t.fecha_fin <= t.fecha_limite ? s.aTiempo++ : s.tarde++;
        } else s.aTiempo++;
      } 
      else if (estado === 'en espera' || estado === '') s.enEspera++;
      else if (estado === 'incompleto') s.vencidos++;
    }
    return s;
  }

  abrirModalTicket(ticket: any) {
    Swal.fire({
      title: `Ticket #${ticket.id}`,
      html: `<div style="text-align:left;">
              <p><b>Solicitante:</b> ${ticket.nombre_usuario}</p>
              <p><b>Técnico:</b> ${ticket.personal || 'N/A'}</p>
              <p><b>Notas:</b> ${ticket.notas || 'Sin notas.'}</p>
             </div>`,
      confirmButtonText: 'Ver Resolución',
      showConfirmButton: ticket.estado === 'Completo' || ticket.estado === 'Completado'
    }).then(r => { if(r.isConfirmed) this.verEvidenciaFinal(ticket); });
  }

  verEvidenciaFinal(ticket: any) {
    this.apiService.getEvidenciaTicket(ticket.id).subscribe(ev => {
      Swal.fire({
        title: `Resolución #${ticket.id}`,
        html: `<div style="text-align:left;">${ev.descripcion_resolucion}</div>
               ${ev.evidencia_archivo ? `<img src="${ev.evidencia_archivo}" style="width:100%; margin-top:10px;">` : ''}`,
        confirmButtonColor: '#56212f'
      });
    });
  }

  private getProblemaColor(d: string): string { const c:any={'Internet':'#2980b9','Office':'#d35400','Telefonia':'#2c3e50','Tecnico':'#16a085','Dictaminar':'#6c5ce7','Correo':'#96241c'}; return c[d]||'#64748b'; }
  private getPrioridadColor(p: string): string { const c:any={'Alta':'#c0392b','Media':'#f39c12','Baja':'#27ae60'}; return c[p]||'#64748b'; }
}