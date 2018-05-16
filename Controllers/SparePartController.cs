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
using VipcoMaintenance.Models.Maintenances;
using AutoMapper;

namespace VipcoMaintenance.Controllers
{
    [Produces("application/json")]
    [Route("api/[controller]")]
    public class SparePartController : GenericController<SparePart>
    {
        private readonly IRepositoryMaintenance<MovementStockSp> repositoryMovement;
        public SparePartController(IRepositoryMaintenance<SparePart> repo,
            IRepositoryMaintenance<MovementStockSp> repoMovement,
            IMapper mapper) :base(repo, mapper) {
            //Repository
            this.repositoryMovement = repoMovement;
        }

        // POST: api/SparePart/GetScroll
        [HttpPost("GetScroll")]
        public async Task<IActionResult> GetScroll([FromBody] ScrollViewModel Scroll)
        {
            if (Scroll == null)
                return BadRequest();

            var QueryData = this.repository.GetAllAsQueryable().AsQueryable();

            // Filter
            var filters = string.IsNullOrEmpty(Scroll.Filter) ? new string[] { "" }
                                : Scroll.Filter.ToLower().Split(null);

            if (Scroll.WhereId.HasValue)
                QueryData = QueryData.Where(x => x.WorkGroupId == Scroll.WhereId);

            foreach (var keyword in filters)
            {
                QueryData = QueryData.Where(x => x.Name.ToLower().Contains(keyword) ||
                                                 x.Description.ToLower().Contains(keyword) ||
                                                 x.Model.ToLower().Contains(keyword) ||
                                                 x.Size.ToLower().Contains(keyword) ||
                                                 x.Property.ToLower().Contains(keyword) ||
                                                 x.Remark.ToLower().Contains(keyword));
            }

            // Order
            switch (Scroll.SortField)
            {
                case "Name":
                    if (Scroll.SortOrder == -1)
                        QueryData = QueryData.OrderByDescending(e => e.Name);
                    else
                        QueryData = QueryData.OrderBy(e => e.Name);
                    break;
                case "Model":
                    if (Scroll.SortOrder == -1)
                        QueryData = QueryData.OrderByDescending(e => e.Model);
                    else
                        QueryData = QueryData.OrderBy(e => e.Model);
                    break;
                default:
                    QueryData = QueryData.OrderByDescending(e => e.Name);
                    break;
            }
            // Get TotalRow
            Scroll.TotalRow = await QueryData.CountAsync();
            // Skip Take
            QueryData = QueryData.Skip(Scroll.Skip ?? 0).Take(Scroll.Take ?? 50);

            var listData = new List<SparePartViewModel>();
            foreach (var item in await QueryData.ToListAsync())
            {
                var MapData = this.mapper.Map<SparePart, SparePartViewModel>(item);
                MapData.OnHand = await this.repositoryMovement.GetAllAsQueryable()
                                            .Where(x => x.SparePartId == MapData.SparePartId && x.MovementStatus != MovementStatus.Cancel)
                                            .SumAsync(x => x.MovementStatus == MovementStatus.AdjustIncrement || 
                                                           x.MovementStatus == MovementStatus.ReceiveStock ? x.Quantity : (x.Quantity * -1));
                listData.Add(MapData);
            }

            return new JsonResult(new ScrollDataViewModel<SparePartViewModel>(Scroll, listData), this.DefaultJsonSettings);
        }
    }
}
