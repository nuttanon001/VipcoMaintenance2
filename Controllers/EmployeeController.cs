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
using AutoMapper;

namespace VipcoMaintenance.Controllers
{
    [Produces("application/json")]
    [Route("api/[controller]")]
    public class EmployeeController : GenericMachineController<Employee>
    {
        private readonly IMapper mapper;

        public EmployeeController(IRepositoryMachine<Employee> repo,
            IMapper map) : base(repo) {
            this.mapper = map;
        }

        // POST: api/Employee/GetScroll
        [HttpPost("GetScroll")]
        public async Task<IActionResult> GetScroll([FromBody] ScrollViewModel Scroll)
        {
            var QueryData = this.repository.GetAllAsQueryable();
            // Where
            if (!string.IsNullOrEmpty(Scroll.Where))
            {
                QueryData = QueryData.Where(x => x.GroupCode == Scroll.Where);
            }
            // Filter
            var filters = string.IsNullOrEmpty(Scroll.Filter) ? new string[] { "" }
                                : Scroll.Filter.ToLower().Split(null);
            foreach (var keyword in filters)
            {
                QueryData = QueryData.Where(x => x.NameEng.ToLower().Contains(keyword) ||
                                                 x.NameThai.ToLower().Contains(keyword) ||
                                                 x.EmpCode.ToLower().Contains(keyword) ||
                                                 x.GroupCode.ToLower().Contains(keyword) ||
                                                 x.GroupName.ToLower().Contains(keyword));
            }

            // Order
            switch (Scroll.SortField)
            {
                case "EmpCode":
                    if (Scroll.SortOrder == -1)
                        QueryData = QueryData.OrderByDescending(e => e.EmpCode);
                    else
                        QueryData = QueryData.OrderBy(e => e.EmpCode);
                    break;

                case "NameThai":
                    if (Scroll.SortOrder == -1)
                        QueryData = QueryData.OrderByDescending(e => e.NameThai);
                    else
                        QueryData = QueryData.OrderBy(e => e.NameThai);
                    break;

                case "GroupName":
                    if (Scroll.SortOrder == -1)
                        QueryData = QueryData.OrderByDescending(e => e.GroupName);
                    else
                        QueryData = QueryData.OrderBy(e => e.GroupName);
                    break;

                default:
                    QueryData = QueryData.OrderBy(e => e.EmpCode.Length)
                                         .ThenBy(e => e.EmpCode);
                    break;
            }
            // Get TotalRow
            Scroll.TotalRow = await QueryData.CountAsync();
            // Skip and Take
            QueryData = QueryData.Skip(Scroll.Skip ?? 0).Take(Scroll.Take ?? 50);
            var ListData = new List<EmployeeViewModel>();
            foreach (var item in await QueryData.ToListAsync())
                ListData.Add(this.mapper.Map<Employee, EmployeeViewModel>(item));

            return new JsonResult(new ScrollDataViewModel<Employee>
                (Scroll, ListData), this.DefaultJsonSettings);
        }
    }
}
