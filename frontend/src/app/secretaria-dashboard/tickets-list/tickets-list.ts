import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core'; 
import { CommonModule } from '@angular/common'; 
import { FormsModule } from '@angular/forms'; 
import { ApiService } from '../../services/api';
import Swal from 'sweetalert2';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-tickets-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tickets-list.html',
  styleUrl: './tickets-list.css'
})

export class TicketsListComponent implements OnInit {
  private apiService = inject(ApiService);
  private cdr = inject(ChangeDetectorRef); 

  listaHistorialCompleto: any[] = [];
  listaTicketsFiltrados: any[] = [];
  reportesAgrupadosPorDia: { fecha: string, tickets: any[] }[] = [];
  tipoBusqueda: string = 'secretaria';
  textoBusqueda: string = '';
  opcionesMesesDisponibles: string[] = [];
  mesFiltroSeleccionado: string = '';
  calendarioVisible: boolean = false;
  diasDelCalendario: any[] = [];
  diaFiltroSeleccionado: number | null = null;
  estadoCargaActivo: boolean = false;
  
  idSecretariaActiva: number = 0;

  ngOnInit() {
    const sesionUsuarioStr = localStorage.getItem('usuario_actual');
    
    if (sesionUsuarioStr) {
        const informacionUsuario = JSON.parse(sesionUsuarioStr);
        this.idSecretariaActiva = informacionUsuario.id; 
        this.solicitarDatosHistorial();
    } else {
        this.estadoCargaActivo = false;
    }
  }

  solicitarDatosHistorial() {
    this.estadoCargaActivo = true;
    
    this.apiService.getTicketsCreadosPorSecretaria(this.idSecretariaActiva).subscribe({
      next: (respuestaApi) => {
        this.listaHistorialCompleto = respuestaApi || [];
        
        this.construirListaDeMesesDisponibles();

        const fechaActual = new Date();
        const añoActual = fechaActual.getFullYear();
        const mesActualFormato = String(fechaActual.getMonth() + 1).padStart(2, '0');
        const cadenaMesActual = `${añoActual}-${mesActualFormato}`; 
        
        if (this.opcionesMesesDisponibles.includes(cadenaMesActual)) {
            this.mesFiltroSeleccionado = cadenaMesActual;
        } else if (this.opcionesMesesDisponibles.length > 0) {
            this.mesFiltroSeleccionado = this.opcionesMesesDisponibles[0];
        }

        this.aplicarFiltroMensual(true);
        
        this.estadoCargaActivo = false;
        this.cdr.detectChanges();
      },
      error: () => { 
          this.estadoCargaActivo = false; 
      }
    });
  }

  construirListaDeMesesDisponibles() {
    const mesesUnicosSet = new Set<string>();
    
    this.listaHistorialCompleto.forEach(ticket => {
      if(ticket.fecha) {
         const cadenaMesAnio = ticket.fecha.substring(0, 7); 
         mesesUnicosSet.add(cadenaMesAnio);
      }
    });
    
    this.opcionesMesesDisponibles = Array.from(mesesUnicosSet).sort().reverse();
  }

  aplicarFiltroMensual(reiniciarFiltroDia: boolean = true) {
    if (reiniciarFiltroDia) {
        this.diaFiltroSeleccionado = null; 
    }
    
    if (!this.mesFiltroSeleccionado) {
        this.listaTicketsFiltrados = this.listaHistorialCompleto;
    } else {
        this.listaTicketsFiltrados = this.listaHistorialCompleto.filter(ticket => 
            ticket.fecha && ticket.fecha.startsWith(this.mesFiltroSeleccionado)
        );
    }

    this.construirEstructuraCalendario(this.listaTicketsFiltrados); 
    
    if (this.diaFiltroSeleccionado === null) {
        this.agruparTicketsPorDia(this.listaTicketsFiltrados);
    }
    
    this.cdr.detectChanges();
  }

  aplicarFiltros(reiniciarFiltroDia: boolean = true) {
    if (reiniciarFiltroDia) {
        this.diaFiltroSeleccionado = null; 
    }
    
    let ticketsProcesados = this.mesFiltroSeleccionado 
        ? this.listaHistorialCompleto.filter(ticket => ticket.fecha && ticket.fecha.startsWith(this.mesFiltroSeleccionado))
        : this.listaHistorialCompleto;

    if (this.textoBusqueda && this.textoBusqueda.trim() !== '') {
        const texto = this.textoBusqueda.toLowerCase().trim();
        
        ticketsProcesados = ticketsProcesados.filter(ticket => {
            if (this.tipoBusqueda === 'id') {
                return ticket.id && ticket.id.toString().includes(texto);
            } else if (this.tipoBusqueda === 'asignadora') {
                const creador = ticket.nombre_creador ? ticket.nombre_creador.toLowerCase() : 'desconocido';
                return creador.includes(texto);
            }
            return true;
        });
    }

    this.listaTicketsFiltrados = ticketsProcesados;
    this.construirEstructuraCalendario(this.listaTicketsFiltrados); 
    
    if (this.diaFiltroSeleccionado === null) {
        this.agruparTicketsPorDia(this.listaTicketsFiltrados);
    }
    
    this.cdr.detectChanges();
  }

  agruparTicketsPorDia(listaParaAgrupar: any[]) {
    if (!listaParaAgrupar || listaParaAgrupar.length === 0) {
        this.reportesAgrupadosPorDia = [];
        return;
    }
    
    const objetoAgrupador: { [claveFecha: string]: any[] } = {};
    
    listaParaAgrupar.forEach(registro => {
        const fechaExtraida = registro.fecha.split(' ')[0];
        
        if (!objetoAgrupador[fechaExtraida]) {
            objetoAgrupador[fechaExtraida] = [];
        }
        
        objetoAgrupador[fechaExtraida].push(registro);
    });
    
    this.reportesAgrupadosPorDia = Object.keys(objetoAgrupador)
      .sort((fechaA, fechaB) => new Date(fechaB).getTime() - new Date(fechaA).getTime())
      .map(fechaLlave => ({ fecha: fechaLlave, tickets: objetoAgrupador[fechaLlave] }));
  }

  alternarVistaCalendario() { 
      this.calendarioVisible = !this.calendarioVisible; 
  }

  construirEstructuraCalendario(ticketsDelPeriodoSeleccionado: any[]) {
    if (!this.mesFiltroSeleccionado) return;
    
    const [añoValor, mesValor] = this.mesFiltroSeleccionado.split('-').map(Number);
    const cantidadDiasEnMes = new Date(añoValor, mesValor, 0).getDate();
    const diaComienzoSemana = new Date(añoValor, mesValor - 1, 1).getDay(); 

    this.diasDelCalendario = [];
    
    for (let iterador = 0; iterador < diaComienzoSemana; iterador++) {
      this.diasDelCalendario.push({ dia: null, tieneTickets: false });
    }
    
    for (let numeroDia = 1; numeroDia <= cantidadDiasEnMes; numeroDia++) {
      const cadenaDiaFormateada = `${this.mesFiltroSeleccionado}-${numeroDia.toString().padStart(2, '0')}`;
      const existenTicketsEseDia = ticketsDelPeriodoSeleccionado.some(ticket => ticket.fecha.startsWith(cadenaDiaFormateada));
      
      this.diasDelCalendario.push({
        dia: numeroDia, 
        fechaCompleta: cadenaDiaFormateada, 
        tieneTickets: existenTicketsEseDia,
        tickets: ticketsDelPeriodoSeleccionado.filter(ticket => ticket.fecha.startsWith(cadenaDiaFormateada))
      });
    }
  }

  filtrarPorDiaSeleccionado(objetoDiaCalendario: any) {
    if (!objetoDiaCalendario.dia) return; 
    
    if (this.diaFiltroSeleccionado === objetoDiaCalendario.dia) {
        this.diaFiltroSeleccionado = null;
        this.agruparTicketsPorDia(this.listaTicketsFiltrados); 
    } else {
        this.diaFiltroSeleccionado = objetoDiaCalendario.dia;
        this.agruparTicketsPorDia(objetoDiaCalendario.tickets); 
        this.calendarioVisible = false; 
    }
  }

  obtenerNombreMesFormateado(cadenaMesAnio: string): string {
    if (!cadenaMesAnio) return '';
    
    const [añoParseado, mesParseado] = cadenaMesAnio.split('-');
    const objetoFechaReferencia = new Date(parseInt(añoParseado), parseInt(mesParseado) - 1, 1);
    const nombreDelMes = objetoFechaReferencia.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
    
    return nombreDelMes.charAt(0).toUpperCase() + nombreDelMes.slice(1);
  }

  mostrarGraficasMensuales() {
    this.lanzarModalGraficas(this.listaTicketsFiltrados, this.obtenerNombreMesFormateado(this.mesFiltroSeleccionado));
  }

  mostrarGraficasDiarias(grupoDeTickets: any) {
     this.lanzarModalGraficas(grupoDeTickets.tickets, `Reporte del Día: ${grupoDeTickets.fecha}`);
  }

  lanzarModalGraficas(conjuntoDeTickets: any[], textoTitulo: string) {
    if (conjuntoDeTickets.length === 0) { 
        Swal.fire({
      title: 'Sin datos suficientes', 
      text: 'No hay historial para generar reporte.', 
      icon: 'info', 
      iconColor: '#56212f',
      confirmButtonText: 'Cerrar', 
      confirmButtonColor: '#000000'
    });
        return; 
    }
    
    const calculoMetricas = this.generarAnalisisDeTickets(conjuntoDeTickets);
    
    const estructuraModalHtml = `
      <div style="padding: 10px;">
        <h3 style="color:#56212f; margin-top:0;">${textoTitulo}</h3>
        <p style="color:#666; margin-bottom: 20px;">Total analizado: <strong>${calculoMetricas.total}</strong> reportes</p>
        
        <div style="display: flex; justify-content: space-around; flex-wrap: wrap; gap: 20px;">
            <div style="width: 220px;"> 
                <h5 style="margin-bottom: 10px; color:#56212f;">Distribución por Prioridad</h5> 
                <canvas id="graficaPrioridadesCanvas" width="220" height="220"></canvas> 
            </div>
            <div style="width: 220px;"> 
                <h5 style="margin-bottom: 10px; color:#56212f;">Distribución por Categoría</h5> 
                <canvas id="graficaProblemasCanvas" width="220" height="220"></canvas> 
            </div>
        </div>
      </div>`;
    
    Swal.fire({ 
        html: estructuraModalHtml, 
        width: '700px', 
        showConfirmButton: false, 
        showCloseButton: true, 
        didOpen: () => { 
            this.inicializarInstanciasGraficas('graficaPrioridadesCanvas', 'graficaProblemasCanvas', calculoMetricas); 
        } 
    });
  }

  generarAnalisisDeTickets(listaEntradaTickets: any[]) {
      const cantidadTotal = listaEntradaTickets.length;
      let contadorAlta = 0;
      let contadorMedia = 0;
      let contadorBaja = 0;
      const categoriasProblemas: {[llaveCategoria: string]: number} = {};

      listaEntradaTickets.forEach(elementoTicket => {
         if (elementoTicket.prioridad === 'Alta') contadorAlta++;
         else if (elementoTicket.prioridad === 'Media') contadorMedia++;
         else if (elementoTicket.prioridad === 'Baja') contadorBaja++;

         const nombreCategoria = elementoTicket.descripcion || 'Sin clasificar';
         categoriasProblemas[nombreCategoria] = (categoriasProblemas[nombreCategoria] || 0) + 1;
      });
      
      return { 
          total: cantidadTotal, 
          alta: contadorAlta, 
          media: contadorMedia, 
          baja: contadorBaja, 
          problemas: categoriasProblemas 
      };
  }

  inicializarInstanciasGraficas(idLienzoPrioridad: string, idLienzoProblema: string, metricasAnalizadas: any) {
      const lienzoPrioridadElem = document.getElementById(idLienzoPrioridad) as HTMLCanvasElement;
      
      if(lienzoPrioridadElem) { 
          new Chart(lienzoPrioridadElem, { 
              type: 'pie', 
              data: { 
                  labels: ['Alta', 'Media', 'Baja'], 
                  datasets: [{ 
                      data: [metricasAnalizadas.alta, metricasAnalizadas.media, metricasAnalizadas.baja], 
                      backgroundColor: ['#f32828', '#f39c12', '#27ae60'], 
                      hoverOffset: 4 
                  }] 
              }, 
              options: { 
                  responsive: true, 
                  plugins: { 
                      legend: { position: 'bottom' } 
                  } 
              } 
          }); 
      }
      
      const lienzoProblemaElem = document.getElementById(idLienzoProblema) as HTMLCanvasElement;
      
      if(lienzoProblemaElem) { 
          const listaEtiquetasCategorias = Object.keys(metricasAnalizadas.problemas);
          const listaDatosCantidades = Object.values(metricasAnalizadas.problemas);
          const matrizColoresFondo = listaEtiquetasCategorias.map(() => '#56212f'); 
          
          new Chart(lienzoProblemaElem, { 
              type: 'bar', 
              data: { 
                  labels: listaEtiquetasCategorias, 
                  datasets: [{ 
                      label: 'Volumen de Tickets', 
                      data: listaDatosCantidades, 
                      backgroundColor: matrizColoresFondo, 
                      borderRadius: 5 
                  }] 
              }, 
              options: { 
                  responsive: true, 
                  plugins: { 
                      legend: { display: false } 
                  }, 
                  scales: { 
                      y: { beginAtZero: true, ticks: { stepSize: 1 } } 
                  } 
              } 
          }); 
      }
  }

  mostrarDetalleNota(textoNota: string) {
    const contenido = textoNota ? textoNota : '<span style="color: #94a3b8; font-style: italic;">Sin información adicional.</span>';

    Swal.fire({
      title: '<h3 style="color: #56212f; margin: 0; font-weight: 700;">Detalle de la Nota</h3>',
      html: `
        <div style="
          background-color: #f8fafc; 
          border: 1px solid #e2e8f0; 
          border-left: 5px solid #977e5b; 
          border-radius: 8px; 
          padding: 20px; 
          margin-top: 15px;
          text-align: left;
          font-size: 0.95rem;
          color: #334155;
          line-height: 1.6;
          max-height: 350px;
          overflow-y: auto;
          white-space: pre-wrap;
          word-wrap: break-word;
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.02);
        ">
          ${contenido}
        </div>
      `,
      icon: 'info',
      iconColor: '#977e5b',
      confirmButtonText: 'Cerrar',
      confirmButtonColor: '#000000',
      background: '#fff',
      width: '500px' 
    });
  }
}