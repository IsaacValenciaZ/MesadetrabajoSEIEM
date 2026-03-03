import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router'; 

@Component({
  selector: 'app-personal-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './personal-dashboard.html',
  styleUrl: './personal-dashboard.css'
})
export class PersonalDashboardComponent implements OnInit {

  private router = inject(Router);
  
  usuarioActual: any = {};
  menuLateralAbierto: boolean = true;
  
  ngOnInit() {
    this.validarAutenticacion();
  }

  alternarMenuLateral() {
    this.menuLateralAbierto = !this.menuLateralAbierto;
  }
  
  validarAutenticacion() {
    const sesionGuardada = localStorage.getItem('usuario_actual');
    
    if (sesionGuardada) {
      this.usuarioActual = JSON.parse(sesionGuardada);
      
      if (this.usuarioActual.rol !== 'personal') {
        this.router.navigate(['/login']);
      }
    } else {
      this.router.navigate(['/login']);
    }
  }

  cerrarSesion() {
    localStorage.removeItem('usuario_actual');
    this.router.navigate(['/login']);
  }
}