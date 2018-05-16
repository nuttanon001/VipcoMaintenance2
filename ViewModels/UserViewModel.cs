using System;
using System.Linq;
using System.Threading.Tasks;
using System.Collections.Generic;
using VipcoMaintenance.Models.Machines;

namespace VipcoMaintenance.ViewModels
{
    public class UserViewModel:User
    {
        public string NameThai { get; set; }
    }
}
