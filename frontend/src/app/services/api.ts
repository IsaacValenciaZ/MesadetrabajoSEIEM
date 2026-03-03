import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  
  private http = inject(HttpClient);
  
  private baseUrl = 'http://10.15.10.46/soporteSEIEM/mesatrabajo/backend'; 

  constructor() { }

  login(email: string, password: string): Observable<any> {
    const body = { email: email, password: password };
    return this.http.post(`${this.baseUrl}/login.php`, body);
  }

  register(usuario: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/register.php`, usuario);
  }
  deleteUser(id: number): Observable<any> {
  return this.http.post(`${this.baseUrl}/delete_user.php`, { id });
}

updateUser(user: any): Observable<any> {
  return this.http.post(`${this.baseUrl}/update_user.php`, user);
}

  getUsers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/get_users.php`);
  }

  createTicket(ticketData: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/create_tickets.php`, ticketData);
  }

  getTicketsHoy(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/get_tickets.php`);
  }

 
  getMisTickets(nombreUsuario: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/get_tickets_personal.php?personal=${nombreUsuario}`);
  }

actualizarEstadoTicketConEvidencia(formData: FormData): Observable<any> {
    return this.http.post(`${this.baseUrl}/update_tickets_personal.php`, formData);
}

  actualizarEstadoTicket(id: number, nuevoEstado: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/update_tickets_personal.php`, { id, estado: nuevoEstado });
  }

getTicketsCreadosPorSecretaria(idSecretaria: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/get_secretaria_tickets.php?id=${idSecretaria}`);
  }

enviarTokenRecuperacion(email: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/recover_password.php`, { email });
  }

  verificarToken(email: string, token: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/verify_token.php`, { email, token });
  }

  cambiarPassword(email: string, newPass: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/reset_password.php`, { email, newPass });
  }
}
