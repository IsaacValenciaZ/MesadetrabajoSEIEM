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
  listaTicketsFiltrados: any[] = []; 
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

  
  private getDetallesExtra(ticket: any, color: string): string {
    if (ticket.descripcion === 'Dictaminar' && ticket.cantidad_dicta) 
      return `<span style="color: #cbd5e1; margin: 0 10px;">|</span> <span style="font-size: 0.9rem; font-weight: 800; color: ${color};">Equipos: ${ticket.cantidad_dicta}</span>`;
    if (ticket.descripcion === 'Correo' && ticket.correo_tipo) 
      return `<span style="color: #cbd5e1; margin: 0 10px;">|</span> <span style="font-size: 0.9rem; font-weight: 800; color: ${color};">Tipo: ${ticket.correo_tipo}</span>`;
    if (ticket.descripcion === 'Tecnico' && ticket.soporte_tipo) 
      return `<span style="color: #cbd5e1; margin: 0 10px;">|</span> <span style="font-size: 0.9rem; font-weight: 800; color: ${color};">Soporte: ${ticket.soporte_tipo}</span>`;
    return '';
  }

  abrirModalTicket(ticket: any) {
    const colorFondoCategoria = this.getProblemaColor(ticket.descripcion);
    const colorPrioridad = this.getPrioridadColor(ticket.prioridad);
    const detallesExtraHtml = this.getDetallesExtra(ticket, colorFondoCategoria);
    
    const htmlModal = `
      <div style="text-align: left; font-family: 'Segoe UI', sans-serif; color: #1e293b;">
        
        <h1 style="font-size: 2.2rem; font-weight: 900; margin: 0 0 20px 0; color: #0f172a; font-style: italic;">Ticket:  #${ticket.id}</h1>

        <div style="display: flex; gap: 40px; margin-bottom: 25px;">
          <div>
            <p style="margin: 0; font-size: 0.75rem; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Fecha de Solicitud</p>
            <p style="margin: 4px 0 0 0; font-size: 0.95rem; font-weight: 600; color: #334155;">${ticket.fecha || 'N/A'}</p>
          </div>
          <div>
            <p style="margin: 0; font-size: 0.75rem; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Vencimiento</p>
            <p style="margin: 4px 0 0 0; font-size: 0.95rem; font-weight: 600; color: #d97706;">${ticket.fecha_limite || 'N/A'}</p>
          </div>
        </div>

        <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 20px 0;">

        <div style="display: flex; gap: 40px; margin-bottom: 25px;">
          <div>
            <p style="margin: 0; font-size: 0.75rem; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Solicitante</p>
            <p style="margin: 4px 0 0 0; font-weight: 800; font-size: 1.1rem; color: #0f172a;">${ticket.nombre_usuario}</p>
          </div>
          <div>
            <p style="margin: 0; font-size: 0.75rem; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Ext / Teléfono</p>
            <p style="margin: 4px 0 0 0; font-weight: 800; font-size: 1.1rem; color: #0f172a;">${ticket.extension_tel || '-'}</p>
          </div>
        </div>

        <div style="margin-bottom: 30px;">
          <p style="margin: 0; font-size: 0.75rem; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Departamento</p>
          <p style="margin: 4px 0 0 0; font-weight: 500; font-size: 1.05rem; color: #334155;">${ticket.departamento}</p>
        </div>

        <p style="margin: 0 0 8px 0; font-size: 0.75rem; color: 64748b; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;  display: inline-block; padding: 4px 8px; border-radius: 4px;">Clasificación del Problema</p>
        
        <div style="display: flex; align-items: center; justify-content: space-between; border: 1px solid #e2e8f0; border-left: 6px solid ${colorFondoCategoria}; border-radius: 8px; padding: 15px; margin-bottom: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
          <div style="display: flex; align-items: center; flex-wrap: wrap;">
            <span style="background-color: ${colorFondoCategoria}; color: white; padding: 4px 12px; border-radius: 4px; font-size: 0.85rem; font-weight: 700;">
              ${ticket.descripcion}
            </span>
            ${detallesExtraHtml}
          </div>
          <p style="color: #64748b; padding: 4px 12px; border-radius: 4px; font-size: 0.85rem; font-weight: 700; white-space: nowrap;">Prio:</p>
          <span style="background-color: ${colorPrioridad}; color: white; padding: 4px 12px; border-radius: 4px; font-size: 0.85rem; font-weight: 700; white-space: nowrap;">
            ${ticket.prioridad}
          </span>
        </div>

        <div>
          <p style="margin: 0 0 8px 0; font-size: 0.75rem; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Notas Adicionales</p>
          <div style="background-color: #f8fafc; border: 1px solid #f1f5f9; border-radius: 8px; padding: 15px;">
            <p style="margin: 0; font-size: 0.95rem; color: #475569; line-height: 1.5;">
              ${ticket.notas ? ticket.notas : '<em style="color: #cbd5e1;">Sin notas adicionales.</em>'}
            </p>
          </div>
        </div>

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