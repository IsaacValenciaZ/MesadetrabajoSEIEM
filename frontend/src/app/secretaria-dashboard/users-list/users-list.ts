import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api';
import { Router } from '@angular/router';
import { Input } from '@angular/core';

@Component({
  selector: 'app-users-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './users-list.html',
  styleUrl: './users-list.css'
})
export class UsersListComponent implements OnInit {
  private servicioApi = inject(ApiService);
  private enrutador = inject(Router);
  private detectorCambios = inject(ChangeDetectorRef); 
  
@Input() esSupervisor: boolean = false;
  listaUsuariosGeneral: any[] = [];

  ngOnInit() {
    this.solicitarUsuariosRegistrados();
  }

  solicitarUsuariosRegistrados() {
    this.servicioApi.getUsers().subscribe({
      next: (datosServidor) => {
        this.listaUsuariosGeneral = datosServidor || [];
        this.detectorCambios.detectChanges(); 
      },
      error: (errorPeticion) => console.error(errorPeticion)
    });
  }

  get listaTecnicos() {
    return (this.listaUsuariosGeneral || []).filter(usuario => usuario.rol === 'personal');
  }

  navegarAFormularioTickets(idUsuario: any) {
    this.enrutador.navigate(['/secretaria/tickets']);
  }
}