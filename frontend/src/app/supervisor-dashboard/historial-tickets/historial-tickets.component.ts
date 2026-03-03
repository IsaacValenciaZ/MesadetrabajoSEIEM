import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-historial-entradas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './historial-tickets.component.html',
  styleUrls: ['./historial-tickets.component.css']
})
export class HistorialEntradasComponent {
 
  tickets = [
    {
      fecha: 'Viernes, 13 de Febrero De 2026',
      total: 2,
      items: [
        { hora: '12:44 a.m.', solicitante: 'Ana López', depto: 'Recursos Humanos', tecnico: 'Isaac', problema: 'No enciende PC', prioridad: 'Alta' },
        { hora: '09:30 a.m.', solicitante: 'Carlos Ruiz', depto: 'Finanzas', tecnico: 'Isaac', problema: 'Impresora atascada', prioridad: 'Media' }
      ]
    },
  ];
}