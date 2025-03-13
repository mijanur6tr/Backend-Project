const asyncHandler = (requestfn)=>{
    return (req,res,next)=>{
        Promise
        .resolve(requestfn(req,res,next))
        .catch((error)=>next(error))

    }
}

export{asyncHandler}

// const asyncHandler = (fn)=> {async ()=>{}}
    //this code is write without the curly brasis like:
    //const asyncHandler = (fn)=> async ()=>{}

    // const asyncHandler = (fn)=> async (req,res,next)=>{
    //     try {
    //         await fn(req,res,next)
    //     } catch (error) {
    //         res.status(error.code||500).json({
    //             seccess:false,
    //             message:error.message,
    //         })
    //     }
    // }