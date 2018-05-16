import { Component, OnInit, ViewChild } from "@angular/core";
import { Router } from "@angular/router";
 import { MatMenuTrigger } from "@angular/material";
// service
// unmark this if AuthService complete
import { AuthService } from "../../core/auth/auth.service";
// model
import { User } from "../../users/shared/user.model";

@Component({
  selector: "app-nav-menu",
  templateUrl: "./nav-menu.component.html",
  styleUrls: ["../../shared/styles/navmenu.style.scss"],
})
export class NavMenuComponent implements OnInit {
  constructor(
    // unmark this if AuthService complete
    private authService: AuthService,
    private router: Router
  ) { }
  // Parameter
   @ViewChild("mainMenu") mainMenu: MatMenuTrigger;
   @ViewChild("subMenu") subMenu: MatMenuTrigger;
   @ViewChild("subMenu2") subMenu2: MatMenuTrigger;

  ngOnInit(): void {
    // reset login status
    this.authService.logout();
  }

  // propertires
  // =============================================\\
  get GetLevel3(): boolean {
    if (this.authService.getAuth) {
      return (this.authService.getAuth.LevelUser || 0) > 2;
    } else {
      return false;
    }
    // return false;
  }

  get GetLevel2(): boolean {
    if (this.authService.getAuth) {
      return (this.authService.getAuth.LevelUser || 0) > 1;
    } else {
      return false;
    }
    // return false;
  }

  get GetLevel1(): boolean {
    if (this.authService.getAuth) {
      return (this.authService.getAuth.LevelUser || 0) > 0;
    } else {
      return false;
    }
    // return true;
  }


  get showLogin(): boolean {
    // unmark this if AuthService complete
    if (this.authService) {
      if (this.authService.isLoggedIn) {
        return !this.authService.isLoggedIn;
      }
    }
    return true;
   // return false;
  }

  get userName(): string {
    if (this.authService.getAuth) {
      if (this.authService.getAuth.NameThai) {
        return " " + this.authService.getAuth.NameThai + " ";
      }
    }
    //return "";
  }

  // on menu close
  // =============================================\\
  menuOnCloseMenu(except?: number): void {
    if (except) {

      //if (except === 1) {
      //  this.subMenu.closeMenu();
      //  this.subMenu2.closeMenu();
      //} else if (except === 2) {
      //  this.mainMenu.closeMenu();
      //  this.subMenu2.closeMenu();
      //} else if (except === 3) {
      //  this.mainMenu.closeMenu();
      //  this.subMenu.closeMenu();
      //}

      if (except === 1 && this.mainMenu) {
        this.mainMenu.closeMenu();
      } else if (except === 2 && this.subMenu) {
        this.subMenu.closeMenu();
      } else if (except === 3 && this.subMenu2) {
        this.subMenu2.closeMenu();
      }
    }
  }

  // =============================================\\
  // on menu open
  // =============================================\\
  menuOnOpenMenu(include?: number): void {
    if (include) {
      if (include === 1 && this.mainMenu) {
        this.mainMenu.openMenu();
        this.closeOtherMenu(2);
        this.closeOtherMenu(3);
      } else if (include === 2 && this.subMenu) {
        this.subMenu.openMenu();
        this.closeOtherMenu(1);
        this.closeOtherMenu(3);
      } else if (include === 3 && this.subMenu2) {
        this.subMenu2.openMenu();
        this.closeOtherMenu(1);
        this.closeOtherMenu(2);
      }
    }
  }

  closeOtherMenu(isClose: number) {
    if (isClose === 1) {
      if (this.mainMenu) {
        this.mainMenu.closeMenu();
      }
    } else if (isClose === 2) {
      if (this.subMenu) {
        this.subMenu.closeMenu();
      }
    } else if (isClose === 3) {
      if (this.subMenu2) {
        this.subMenu2.closeMenu();
      }
    }
  }
  // =============================================\\
  onLogOut(): void {
    // this.authService.logout();
    this.router.navigate(["login"]);
  }
}
