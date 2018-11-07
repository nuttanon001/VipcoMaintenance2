using System;
using System.Linq;
using System.Threading.Tasks;
using System.Linq.Expressions;
using System.Collections.Generic;

using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

using VipcoMaintenance.Services;
using VipcoMaintenance.ViewModels;
using VipcoMaintenance.Models.Machines;
using VipcoMaintenance.Models.Maintenances;

using AutoMapper;

namespace VipcoMaintenance.Controllers
{
    [Produces("application/json")]
    [Route("api/[controller]")]
    public class UserController : GenericMachineController<User>
    {
        #region PrivateMenbers
        private readonly IRepositoryMaintenanceMk2<Permission> repositoryPermission;
        private readonly IMapper mapper;

        #endregion PrivateMenbers

        #region Constructor

        public UserController(
            IRepositoryMachineMk2<User> repo,
            IRepositoryMaintenanceMk2<Permission> repoPermission, IMapper map): base(repo)
        {
            //Machine
            this.repository = repo;
            //Painting
            this.repositoryPermission = repoPermission;
            this.mapper = map;
        }

        #endregion

        #region POST
        // POST: api/LoginName/Login
        [HttpPost("Login")]
        public async Task<IActionResult> Login([FromBody] User login)
        {

            var Message = "Login has error.";
            try
            {
                var HasData = await this.repository.GetFirstOrDefaultAsync(
                                        x => x, m => m.UserName.ToLower() == login.UserName.ToLower() &&
                                                     m.PassWord.ToLower() == login.PassWord.ToLower(),
                                        null,x => x.Include(z => z.EmpCodeNavigation));
                if (HasData != null)
                {
                    if (HasData.LevelUser < 3)
                    {
                        var DataPermission = await this.repositoryPermission.GetFirstOrDefaultAsync(x => x,x => x.UserId == HasData.UserId);
                        if (DataPermission != null)
                            HasData.LevelUser = DataPermission.LevelPermission;
                        else
                            HasData.LevelUser = 1;
                    }
                    return new JsonResult(this.mapper.Map<User, UserViewModel>(HasData), this.DefaultJsonSettings);
                }
                else
                    return NotFound(new { Error = "user or password not match" });
            }
            catch (Exception ex)
            {
                Message = $"Has error {ex.ToString()}";
            }
            return NotFound(new { Error = Message });
        }
        
        #endregion
    }
}
