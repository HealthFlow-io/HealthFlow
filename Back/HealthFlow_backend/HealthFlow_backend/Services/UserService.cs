using HealthFlow_backend.Models;
using HealthFlow_backend.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace HealthFlow_backend.Services;

[ApiController]
[Route("api/v1/[controller]")]
public class UserService : ControllerBase
{
    private readonly GenericRepository<ApplicationUser> _repository;
    private readonly UserManager<IdentityUser> _userManager;
 
    public UserService(GenericRepository<ApplicationUser> repository)
    {
        _repository = repository;
    }

    [Authorize(Roles=AppRoles.Admin)]
    [HttpGet]
    public async Task<ActionResult<List<ApplicationUser>>> GetAll()
    {
        var users = await _repository.GetAllAsync();
        return Ok(users); 
    }
    
    
}