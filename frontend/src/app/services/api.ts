import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  
  private http = inject(HttpClient);
  
 private baseUrl = 'http://10.15.10.46/soporteSEIEM/MesadetrabajoSEIEM/backend'; 
  //private baseUrl = 'http://localhost/mesatrabajoBACKEND/backend/'; 

  constructor() { }

  deleteUser(id: number): Observable<any> {
  return this.http.post(`${this.baseUrl}/delete_user.php`, { id });
}
  
  createTicket(ticketData: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/create_tickets.php`, ticketData);
  }
 
  getMisTickets(nombreUsuario: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/get_tickets_personal.php?personal=${nombreUsuario}`);
  }

 actualizarEstadoTicket(id: number, nuevoEstado: string): Observable<any> {
    const formData = new FormData();
    formData.append('id', id.toString());
    formData.append('estado', nuevoEstado);
    return this.http.post<any>(`${this.baseUrl}/update_tickets_personal.php`, formData);
  }

  getEvidenciaTicket(id: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/get_evidencia_personal.php?id=${id}`);
  }

  getTicketsCreadosPorSecretaria(idSecretaria: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/get_secretaria_tickets.php?id=${idSecretaria}`);
  }

  getMetricasPorSecretaria(id: number): Observable<any[]> {
  return this.http.get<any[]>(`${this.baseUrl}/get_secretaria_metrics.php?id=${id}`);
}

    getDatosDeSecretaria(idSecretaria: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/get_secretaria_profile_tickets.php?id=${idSecretaria}`);
  }

  getTicketsHoy(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/get_secretaria_h_tickets.php`);
  }

  
  getUsers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/get_secretaria_users.php`);
  }

getSupervisorDataTickets(): Observable<any[]> {
  return this.http.get<any[]>(`${this.baseUrl}/get_supervisor_data_tickets.php`);
}

getSupervisorEvidencia(id: number): Observable<any> {
  return this.http.get<any>(`${this.baseUrl}/get_supervisor_evidencia.php?id=${id}`);
}

getSupervisorUsers(): Observable<any[]> {
  return this.http.get<any[]>(`${this.baseUrl}/get_supervisor_users.php`);
}

  login(email: string, password: string): Observable<any> {
  const body = { email: email, password: password };
  return this.http.post(`${this.baseUrl}/login.php`, body);
  }

  enviarTokenRecuperacion(email: string): Observable<any> {
  return this.http.post(`${this.baseUrl}/recover_password.php`, { email });
  }

  register(usuario: any): Observable<any> {
  return this.http.post(`${this.baseUrl}/register.php`, usuario);
  }

  cambiarPassword(email: string, newPass: string): Observable<any> {
  return this.http.post(`${this.baseUrl}/reset_password.php`, { email, newPass });
  }

  updateProfile(datosPerfil: any): Observable<any> {
  return this.http.post<any>(`${this.baseUrl}/update_profile.php`, datosPerfil);
  }

  actualizarEstadoDisponibilidad(datos: { id: number, estado: string }): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/update_status.php`, datos);
  }

  actualizarEstadoTicketConEvidencia(datos: any): Observable<any> {
  return this.http.post(`${this.baseUrl}/update_tickets_personal.php`, datos);
}

updateUser(user: any): Observable<any> {
  return this.http.post(`${this.baseUrl}/update_user.php`, user);
 } 

verificarToken(email: string, token: string): Observable<any> {
  return this.http.post(`${this.baseUrl}/verify_token.php`, { email, token });
}
}
