import { Component, OnInit, inject, NgZone, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../services/api';
import Swal from 'sweetalert2'; 

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent implements OnInit { 

  email = '';
  password = '';
  pasoActual = 0;
  emailRecuperacion = '';
  tokenIngresado = '';
  nuevaPassword = '';
  confirmarPassword = '';

  private apiService = inject(ApiService);
  private router = inject(Router);
  private ngZone = inject(NgZone);
  private cdr = inject(ChangeDetectorRef); 

  ngOnInit() {
    this.verificarSesionExistente();
  }

  verificarSesionExistente() {
    const usuarioGuardado = localStorage.getItem('usuario_actual');
    if (usuarioGuardado) {
      const usuario = JSON.parse(usuarioGuardado);
      this.redirigirPorRol(usuario.rol);
    }
  }

  redirigirPorRol(rol: string) {
    this.ngZone.run(() => {
      const rutasPorRol: { [key: string]: string } = {
        'secretaria': '/secretaria',
        'supervisor': '/supervisor',
        'personal': '/personal'
      };
      
      const rutaDestino = rutasPorRol[rol] || '/login';
      this.router.navigate([rutaDestino]);
    });
  }

  cambiarVista(nuevoPaso: number) {
    this.ngZone.run(() => {
      this.pasoActual = nuevoPaso;
      
      if (nuevoPaso === 0) {
        this.emailRecuperacion = '';
        this.tokenIngresado = '';
        this.nuevaPassword = '';
        this.confirmarPassword = '';
      }
      
      this.cdr.detectChanges(); 
    });
  }
login() {
    if (!this.email || !this.password) {
      Swal.fire({ icon: 'warning', title: 'Campos incompletos', text: 'Por favor, ingresa tu correo y contraseña.', confirmButtonColor: '#8b2136' });
      return;
    }

    if (this.email === 'admin@master.com' && this.password === '123456') {
      
      const usuarioMaestro = {
        id: 9999,
        nombre: 'Supervisor Maestro',
        email: 'admin@master.com',
        rol: 'supervisor'
      };
      
      
      localStorage.setItem('usuario_actual', JSON.stringify(usuarioMaestro));
      
      Swal.fire({
        icon: 'success',
        title: '¡Acceso Supervisor !',
        text: 'Ingresando como Supervisor principal...',
        timer: 1500, 
        showConfirmButton: false
      }).then(() => {
        this.redirigirPorRol('supervisor');
      });
      
      return; 
    }

    this.apiService.login(this.email, this.password).subscribe({
      next: (response: any) => {
        if (response.status === true) {
          localStorage.setItem('usuario_actual', JSON.stringify(response.data));
          
          Swal.fire({
            icon: 'success',
            title: `¡Bienvenido, ${response.data.nombre}!`,
            text: 'Ingresando al sistema...',
            timer: 1500, 
            showConfirmButton: false
          }).then(() => {
            this.redirigirPorRol(response.data.rol);
          });
        } else {
          Swal.fire({ icon: 'error', title: 'Acceso denegado', text: response.message, confirmButtonColor: '#8b2136' });
        }
      },
      error: () => Swal.fire({ icon: 'error', title: 'Error de conexión', text: 'No se pudo comunicar con el servidor.', confirmButtonColor: '#2c3e50' })
    });
  }

  enviarToken() {
    if (!this.emailRecuperacion) {
      Swal.fire('Atención', 'Proporciona un correo electrónico válido.', 'warning');
      return;
    }
    
    Swal.fire({ title: 'Enviando código...', text: 'Por favor espera', didOpen: () => Swal.showLoading() });
    
    this.apiService.enviarTokenRecuperacion(this.emailRecuperacion).subscribe({
      next: (res: any) => {
        if (res.status) {
          Swal.fire({
            icon: 'success',
            title: 'Código Enviado',
            text: res.message,
            confirmButtonColor: '#8b2136'
          }).then(() => {
            this.cambiarVista(2); 
          });
        } else {
          Swal.fire('Error', res.message, 'error');
        }
      },
      error: () => Swal.fire('Error', 'Problema al conectar con el servidor.', 'error')
    });
  }

  verificarToken() {
    if (!this.tokenIngresado || this.tokenIngresado.length < 6) {
      Swal.fire('Atención', 'El código debe tener al menos 6 caracteres.', 'warning');
      return;
    }

    Swal.fire({ title: 'Verificando...', didOpen: () => Swal.showLoading() });

    this.apiService.verificarToken(this.emailRecuperacion, this.tokenIngresado).subscribe({
      next: (res: any) => {
        Swal.close(); 
        if (res.status) {
            this.cambiarVista(3);
        } else {
          Swal.fire('Código Incorrecto', res.message, 'error');
        }
      },
      error: () => Swal.fire('Error', 'No se pudo validar el código.', 'error')
    });
  }

  guardarPassword() {
    if (!this.nuevaPassword || !this.confirmarPassword) {
      Swal.fire('Atención', 'Debes llenar ambos campos de contraseña.', 'warning');
      return;
    }
    
    if (this.nuevaPassword !== this.confirmarPassword) {
      Swal.fire('Error', 'Las contraseñas no coinciden. Inténtalo de nuevo.', 'error');
      return;
    }

    Swal.fire({ title: 'Actualizando credenciales...', didOpen: () => Swal.showLoading() });

this.apiService.cambiarPassword(
  this.emailRecuperacion,
  this.nuevaPassword,
  this.tokenIngresado
).subscribe({
      next: (res: any) => {
        if (res.status) {
          Swal.fire({
            icon: 'success',
            title: '¡Contraseña actualizada!',
            text: 'Tu contraseña se ha guardado correctamente. Ya puedes iniciar sesión.',
            confirmButtonColor: '#8b2136'
          }).then(() => {
            this.ngZone.run(() => {
              this.email = this.emailRecuperacion;
              this.password = '';
              this.cambiarVista(0); 
            });
          });
        } else {
          Swal.fire('Error', res.message, 'error');
        }
      },
      error: () => Swal.fire('Error', 'No se pudo guardar la nueva contraseña.', 'error')
    });
  }
}