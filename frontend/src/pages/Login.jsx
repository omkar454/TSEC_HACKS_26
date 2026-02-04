import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import CustomButton from '../components/CustomButton'
import FormField from '../components/FormField'

const Login = () => {
    const navigate = useNavigate();
    const [form, setForm] = useState({
        email: '',
        password: ''
    });

    const handleFormFieldChange = (fieldName, e) => {
        setForm({ ...form, [fieldName]: e.target.value })
    }

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log("Login:", form);
        // Mock login logic
        navigate('/');
    }

    return (
        <div className="bg-[#1c1c24] flex justify-center items-center flex-col rounded-[10px] sm:p-10 p-4 min-h-[50vh] max-w-[500px] mx-auto mt-20">
            <h1 className="font-epilogue font-bold sm:text-[25px] text-[18px] leading-[38px] text-white">Welcome Back</h1>
            <p className="font-epilogue font-normal text-[14px] text-[#808191] mt-[10px]">Login to continue</p>

            <form onSubmit={handleSubmit} className="w-full mt-[30px] flex flex-col gap-[20px]">
                <FormField
                    labelName="Email"
                    placeholder="example@email.com"
                    inputType="email"
                    value={form.email}
                    handleChange={(e) => handleFormFieldChange('email', e)}
                />
                <FormField
                    labelName="Password"
                    placeholder="password"
                    inputType="password"
                    value={form.password}
                    handleChange={(e) => handleFormFieldChange('password', e)}
                />

                <div className="flex justify-center items-center mt-[20px]">
                    <CustomButton
                        btnType="submit"
                        title="Log In"
                        styles="bg-[#1dc071] w-full"
                    />
                </div>

                <p className="font-epilogue font-normal text-[14px] text-[#808191] text-center mt-[10px]">
                    Don't have an account? <Link to="/signup" className="text-[#1dc071]">Sign Up</Link>
                </p>
            </form>
        </div>
    )
}

export default Login
