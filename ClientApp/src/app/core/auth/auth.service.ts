import { Injectable } from "@angular/core";
import { HttpClient, HttpParams, HttpHeaders } from "@angular/common/http";
// rxjs
import { map } from "rxjs/operator/map";
import { Observable } from "rxjs/Observable";
import { catchError } from "rxjs/operators";
// model
import { User } from "../../users/shared/user.model";


@Injectable()
export class AuthService {
  userName: string;
  authKey = "auth";
  // store the URL so we can redirect after logging in
  redirectUrl: string;


  constructor(
    private http:HttpClient
  ) { }

  login(user: User): Observable<any> {
    let httpOptions = {
      headers: new HttpHeaders({
        "Content-Type": "application/json",
        // "Authorization": "my-auth-token"
      })
    };

    return this.http.post<User>
      ("api/User/Login/", JSON.stringify(user), httpOptions)
      .map((dbUser) => {
        this.setAuth = dbUser;
        this.userName = dbUser.UserName; //data.UserName;
        return dbUser;
      });
  }

  logout(): boolean {
    this.setAuth = null;
    this.userName = "";
    return false;
  }

  // Converts a Json object to urlencoded format
  toUrlEncodedString(data: any) {
    let body = "";
    for (let key in data) {
      if (body.length) {
        body += "&";
      }
      body += key + "=";
      body += encodeURIComponent(data[key]);
    }
    return body;
  }
  // Persist auth into localStorage or removes it if a NULL argument is given
  set setAuth(auth: any) {
    if (auth) {
      localStorage.setItem(this.authKey, JSON.stringify(auth));
    }
    else {
      localStorage.removeItem(this.authKey);
    }
  }
  // Retrieves the auth JSON object (or NULL if none)
  get getAuth(): User | undefined {
    let i = localStorage.getItem(this.authKey);
    if (i) {
      return JSON.parse(i);
    }
    else {
      return undefined;
    }
  }

  get isLoggedIn(): boolean {
    if (this.getAuth) {
      return true;
    }
    else
      return false;
  }
}
