import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-supervisor-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './supervisor-dashboard.html',
  styleUrls: ['./supervisor-dashboard.css']
})
export class SupervisorDashboardComponent implements OnInit {
  router = inject(Router);
  
  usuarioActual: any = {};
  menuLateralAbierto: boolean = true; 

  ngOnInit() {
    const sesion = localStorage.getItem('usuario_actual');
    if (sesion) {
      this.usuarioActual = JSON.parse(sesion);
    }
  }

  alternarMenuLateral() {
    this.menuLateralAbierto = !this.menuLateralAbierto;
  }

  logout() {
    localStorage.removeItem('usuario_actual');
    this.router.navigate(['/login']);
  }
}