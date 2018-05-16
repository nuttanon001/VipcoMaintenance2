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
    public class RequisitionStockSpController : GenericController<RequisitionStockSp>
    {

        private readonly IRepositoryMaintenance<MovementStockSp> repositoryMovement;
        private readonly IRepositoryMaintenance<SparePart> repositorySpare;
        private readonly IRepositoryMachine<Employee> repositoryEmployee;

        public RequisitionStockSpController(IRepositoryMaintenance<RequisitionStockSp> repo,
            IRepositoryMaintenance<MovementStockSp> repoMovement,
            IRepositoryMaintenance<SparePart> repoSpare,
            IRepositoryMachine<Employee> repoEmployee,
            IMapper mapper) : base(repo, mapper)
        {
            // Repository
            this.repositoryMovement = repoMovement;
            this.repositorySpare = repoSpare;
            this.repositoryEmployee = repoEmployee;
        }

        // GET:api/RequisitionStockSp/GetRequisitionByItemMaintenance/5
        [HttpGet("GetRequisitionByItemMaintenance")]
        public async Task<IActionResult> GetRequisitionByItemMaintenance(int key)
        {
            if (key > 0)
            {
                var HasData = await this.repository.GetAllAsQueryable().Where(x => x.ItemMaintenanceId == key)
                                        .ToListAsync();

                if (HasData != null)
                {
                    var ListData = new List<RequisitionStockSpViewModel>();
                    foreach (var item in HasData)
                        ListData.Add(this.mapper.Map<RequisitionStockSp, RequisitionStockSpViewModel>(item));
                   
                    return new JsonResult(ListData, this.DefaultJsonSettings);
                }
            }
            return BadRequest();
        }

        // GET: api/RequisitionStockSp/5
        [HttpGet("GetKeyNumber")]
        public override async Task<IActionResult> Get(int key)
        {
            var HasItem = await this.repository.GetAsync(key, true);
            if (HasItem != null)
            {
                var MapItem = this.mapper.Map<RequisitionStockSp, RequisitionStockSpViewModel>(HasItem);
                if (!string.IsNullOrEmpty(MapItem.RequisitionEmp))
                    MapItem.RequisitionEmpString = (await this.repositoryEmployee.GetAsync(MapItem.RequisitionEmp)).NameThai;

                return new JsonResult(MapItem, this.DefaultJsonSettings);
            }
            return BadRequest();
        }

        // POST: api/RequisitionStockSp/GetScroll/
        [HttpPost("GetScroll")]
        public async Task<IActionResult> GetScroll([FromBody] ScrollViewModel Scroll)
        {
            if (Scroll == null)
                return BadRequest();

            var QueryData = this.repository.GetAllAsQueryable()
                                           .AsQueryable();

            if (!string.IsNullOrEmpty(Scroll.Where))
                QueryData = QueryData.Where(x => x.Creator == Scroll.Where);

            // Filter
            var filters = string.IsNullOrEmpty(Scroll.Filter) ? new string[] { "" }
                                : Scroll.Filter.ToLower().Split(null);

            foreach (var keyword in filters)
            {
                QueryData = QueryData.Where(x => x.PaperNo.ToLower().Contains(keyword) ||
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

                case "RequisitionDate":
                    if (Scroll.SortOrder == -1)
                        QueryData = QueryData.OrderByDescending(e => e.RequisitionDate);
                    else
                        QueryData = QueryData.OrderBy(e => e.RequisitionDate);
                    break;

                default:
                    QueryData = QueryData.OrderByDescending(e => e.RequisitionDate);
                    break;
            }
            // Get TotalRow
            Scroll.TotalRow = await QueryData.CountAsync();
            // Skip Take
            QueryData = QueryData.Skip(Scroll.Skip ?? 0).Take(Scroll.Take ?? 50);

            var listData = new List<RequisitionStockSpViewModel>();
            foreach (var item in await QueryData.ToListAsync())
                listData.Add(this.mapper.Map<RequisitionStockSp, RequisitionStockSpViewModel>(item));

            return new JsonResult(new ScrollDataViewModel<RequisitionStockSpViewModel>(Scroll, listData), this.DefaultJsonSettings);
        }

        // POST: api/RequisitionStockSp/
        [HttpPost]
        public override async Task<IActionResult> Create([FromBody] RequisitionStockSp record)
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
                    MovementDate = record.RequisitionDate,
                    MovementStatus = MovementStatus.RequisitionStock,
                    Quantity = record.Quantity,
                    SparePartId = record.SparePartId,
                };

            if (await this.repository.AddAsync(record) == null)
                return BadRequest();
            return new JsonResult(record, this.DefaultJsonSettings);
        }
        // PUT: api/RequisitionStockSp/
        [HttpPut]
        public override async Task<IActionResult> Update(int key, [FromBody] RequisitionStockSp record)
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
                        editMovement.MovementDate = record.RequisitionDate;
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
                        MovementDate = record.RequisitionDate,
                        MovementStatus = MovementStatus.RequisitionStock,
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
