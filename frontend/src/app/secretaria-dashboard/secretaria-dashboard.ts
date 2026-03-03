import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

@Component({
  selector: 'app-secretaria-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule], 
  templateUrl: './secretaria-dashboard.html', 
  styleUrl: './secretaria-dashboard.css'
})
export class SecretariaDashboardComponent implements OnInit {
  private enrutador = inject(Router);
  
  menuLateralAbierto = true;
  nombreSecretaria: string = '';
  datosUsuarioActivo: any = { nombre: '' };

  ngOnInit() {
    const sesionUsuario = localStorage.getItem('usuario_actual');
    
    if (sesionUsuario) {
      const objetoUsuario = JSON.parse(sesionUsuario);
      this.datosUsuarioActivo = objetoUsuario;
      this.nombreSecretaria = objetoUsuario.nombre; 
    }
  }

  alternarMenuLateral() {
    this.menuLateralAbierto = !this.menuLateralAbierto;
  }

  cerrarSesion() {
    localStorage.removeItem('usuario_actual');
    this.enrutador.navigate(['/login']);
  }
}