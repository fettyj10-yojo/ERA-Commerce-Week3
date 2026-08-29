function authorizeRole(role){
    return function (req, res, next){
        if(req.user.role !== role){
            return res.status(403).json({message: "Access Denied. You do not have permission to access this resource."});
        }
        next();
    };
}

module.exports = authorizeRole;
