using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using VipcoMaintenance.Models.Machines;
using VipcoMaintenance.Models.Maintenances;
using VipcoMaintenance.Services;
using VipcoMaintenance.ViewModels;

namespace VipcoMaintenance.Controllers
{
    [Produces("application/json")]
    [Route("api/[controller]")]
    public class AdjustStockSpController : GenericController<AdjustStockSp>
    {
        private readonly IRepositoryMaintenance<MovementStockSp> repositoryMovement;
        private readonly IRepositoryMaintenance<SparePart> repositorySpare;
        private readonly IRepositoryMachine<Employee> repositoryEmployee;

        public AdjustStockSpController(IRepositoryMaintenance<AdjustStockSp> repo,
            IRepositoryMaintenance<MovementStockSp> repoMovement,
            IRepositoryMaintenance<SparePart> repoSpare,
            IRepositoryMachine<Employee> repoEmployee,
            IMapper map) : base(repo,map)
        {
            // Repository
            this.repositoryMovement = repoMovement;
            this.repositorySpare = repoSpare;
            this.repositoryEmployee = repoEmployee;
        }

        // GET: api/AdjustStockSp/5
        [HttpGet("GetKeyNumber")]
        public override async Task<IActionResult> Get(int key)
        {
            var HasItem = await this.repository.GetAsynvWithIncludes(key, "AdjustStockSpId", new List<string> { "SparePart" });
            if (HasItem != null)
            {
                var MapItem = this.mapper.Map<AdjustStockSp, AdjustStockSpViewModel>(HasItem);
                if (!string.IsNullOrEmpty(MapItem.EmpCode))
                    MapItem.AdjustEmpString = (await this.repositoryEmployee.GetAsync(MapItem.EmpCode)).NameThai;

                return new JsonResult(MapItem, this.DefaultJsonSettings);
            }
            return BadRequest();
        }

        // POST: api/AdjustStockSp/GetScroll
        [HttpPost("GetScroll")]
        public async Task<IActionResult> GetScroll([FromBody] ScrollViewModel Scroll)
        {
            if (Scroll == null)
                return BadRequest();

            var QueryData = this.repository.GetAllAsQueryable()
                                            .Include(x => x.SparePart)
                                            .AsQueryable();

            if (!string.IsNullOrEmpty(Scroll.Where))
                QueryData = QueryData.Where(x => x.Creator == Scroll.Where);

            // Filter
            var filters = string.IsNullOrEmpty(Scroll.Filter) ? new string[] { "" }
                                : Scroll.Filter.ToLower().Split(null);

            foreach (var keyword in filters)
            {
                QueryData = QueryData.Where(x => x.Description.ToLower().Contains(keyword) ||
                                                 x.Remark.ToLower().Contains(keyword) ||
                                                 x.SparePart.Name.ToLower().Contains(keyword));
            }

            // Order
            switch (Scroll.SortField)
            {
                case "SparePartName":
                    if (Scroll.SortOrder == -1)
                        QueryData = QueryData.OrderByDescending(e => e.SparePart.Name);
                    else
                        QueryData = QueryData.OrderBy(e => e.SparePart.Name);
                    break;

                case "Quantity":
                    if (Scroll.SortOrder == -1)
                        QueryData = QueryData.OrderByDescending(e => e.Quantity);
                    else
                        QueryData = QueryData.OrderBy(e => e.Quantity);
                    break;

                case "AdjustDate":
                    if (Scroll.SortOrder == -1)
                        QueryData = QueryData.OrderByDescending(e => e.AdjustDate);
                    else
                        QueryData = QueryData.OrderBy(e => e.AdjustDate);
                    break;

                default:
                    QueryData = QueryData.OrderByDescending(e => e.AdjustDate);
                    break;
            }
            // Get TotalRow
            Scroll.TotalRow = await QueryData.CountAsync();
            // Skip Take
            QueryData = QueryData.Skip(Scroll.Skip ?? 0).Take(Scroll.Take ?? 50);

            var HasData = await QueryData.ToListAsync();
            var listData = new List<AdjustStockSpViewModel>();
            foreach (var item in HasData)
                listData.Add(this.mapper.Map<AdjustStockSp, AdjustStockSpViewModel>(item));

            return new JsonResult(new ScrollDataViewModel<AdjustStockSpViewModel>(Scroll, listData), this.DefaultJsonSettings);
        }

        // POST: api/AdjustStockSp/
        [HttpPost]
        public override async Task<IActionResult> Create([FromBody] AdjustStockSp record)
        {
            // Set date for CrateDate Entity
            if (record == null)
                return BadRequest();
            // +7 Hour
            record = this.helper.AddHourMethod(record);
            record.CreateDate = DateTime.Now;

            if (record.MovementStockSp == null)
                record.MovementStockSp = new MovementStockSp()
                {
                    CreateDate = record.CreateDate,
                    Creator = record.Creator,
                    MovementDate = record.AdjustDate,
                    MovementStatus = MovementStatus.AdjustDecrement,
                    Quantity = record.Quantity,
                    SparePartId = record.SparePartId,
                };

            if (await this.repository.AddAsync(record) == null)
                return BadRequest();
            return new JsonResult(record, this.DefaultJsonSettings);
        }
        //PUT: api/AdjutStockSp/
        [HttpPut]
        public override async Task<IActionResult> Update(int key, [FromBody] AdjustStockSp record)
        {
            if (key < 1)
                return BadRequest();
            if (record == null)
                return BadRequest();

            // +7 Hour
            record = this.helper.AddHourMethod(record);

            // Set date for CrateDate Entity
            record.ModifyDate = DateTime.Now;
            if (await this.repository.UpdateAsync(record, key) == null)
                return BadRequest();
            else
            {
                // if have movement update to database
                if (record.MovementStockSpId.HasValue && record.MovementStockSpId > 0)
                {
                    var editMovement = await this.repositoryMovement.GetAsync(record.MovementStockSpId.Value);
                    if (editMovement != null)
                    {
                        editMovement.ModifyDate = record.ModifyDate;
                        editMovement.Modifyer = record.Modifyer;
                        editMovement.MovementDate = record.AdjustDate;
                        editMovement.Quantity = record.Quantity;
                        editMovement.SparePartId = record.SparePartId;

                        await this.repositoryMovement.UpdateAsync(editMovement, editMovement.MovementStockSpId);
                    }
                }
                else // If don't have movement add new to database
                {
                    var newMovement = new MovementStockSp()
                    {
                        CreateDate = record.CreateDate,
                        Creator = record.Creator,
                        MovementDate = record.AdjustDate,
                        MovementStatus = MovementStatus.AdjustDecrement,
                        Quantity = record.Quantity,
                        SparePartId = record.SparePartId,
                    };

                    if (await this.repositoryMovement.AddAsync(newMovement) != null)
                    {
                        record.MovementStockSpId = newMovement.MovementStockSpId;
                        await this.repository.UpdateAsync(record, key);
                    }
                }
            }

            return new JsonResult(record, this.DefaultJsonSettings);
        }
    }
}