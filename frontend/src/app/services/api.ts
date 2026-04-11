import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  
  private http = inject(HttpClient);
  
private baseUrl = environment.apiUrl;

  constructor() { }

  deleteUser(id: number): Observable<any> {
  return this.http.post(`${this.baseUrl}/delete_user.php`, { id });
}
  
  createTicket(ticketData: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/create_tickets.php`, ticketData);
  }

  deleteTicket(id: number) {
  return this.http.delete<any>(`${this.baseUrl}/delete_ticket.php`, { body: { id } });
}
 
  getMisTickets(nombreUsuario: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/get_tickets_personal.php?personal=${nombreUsuario}`);
  }

actualizarEstadoTicket(id: number, nuevoEstado: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/update_tickets_personal.php`, { id, estado: nuevoEstado });
  }

  getEvidenciaTicket(id: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/get_evidencia_personal.php?id=${id}`);
  }

  getTicketsCreadosPorSecretaria(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/get_secretaria_tickets.php`);
  }

  getMesesDisponibles(): Observable<string[]> {
    return this.http.get<string[]>(`${this.baseUrl}/get_meses_disponibles.php`);
}

getTodosLosTickets(mes: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/get_secretaria_tickets.php?mes=${mes}`);
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


getSupervisorDataTickets(mes?: string) {
  const params = mes ? `?mes=${mes}` : '';
  return this.http.get<any[]>(`${this.baseUrl}/get_supervisor_data_tickets.php${params}`);
}

getSupervisorEvidencia(id: number): Observable<any> {
  return this.http.get<any>(`${this.baseUrl}/get_supervisor_evidencia.php?id=${id}`);
}

getSupervisorUsers(): Observable<any[]> {
  return this.http.get<any[]>(`${this.baseUrl}/get_supervisor_users.php`);
}

getReportMetrics(periodo: string = 'mes') {
    return this.http.get(`${this.baseUrl}/get_report_metrics.php?periodo=${periodo}`);
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

cambiarPassword(email: string, newPass: string, token: string): Observable<any> {
  return this.http.post(`${this.baseUrl}/reset_password.php`, {
    email: email,
    newPass: newPass,
    token: token
  });
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
