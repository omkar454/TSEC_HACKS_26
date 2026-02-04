import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import CustomButton from '../components/CustomButton'
import FormField from '../components/FormField'
import { useAuth } from '../context/AuthContext'

const Signup = () => {
    const navigate = useNavigate();
    const { signup } = useAuth();
    const [form, setForm] = useState({
        name: '',
        email: '',
        password: '',
        role: 'CONTRIBUTOR'
    });

    const handleFormFieldChange = (fieldName, e) => {
        setForm({ ...form, [fieldName]: e.target.value })
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        const result = await signup(form.name, form.email, form.password, form.role);
        if (result.success) {
            navigate('/');
        } else {
            alert(result.message);
        }
    }

    return (
        <div className="bg-[var(--secondary)] flex justify-center items-center flex-col rounded-[10px] sm:p-10 p-4 max-w-[500px] mx-auto mt-10 border border-[#3a3a43]">
            <h1 className="font-epilogue font-bold sm:text-[25px] text-[18px] leading-[38px] text-[var(--text-primary)]">Create Account</h1>
            <p className="font-epilogue font-normal text-[14px] text-[#808191] mt-[10px]">Join Lazarus today</p>

            <form onSubmit={handleSubmit} className="w-full mt-[30px] flex flex-col gap-[20px]">
                <FormField
                    labelName="Full Name"
                    placeholder="John Doe"
                    inputType="text"
                    value={form.name}
                    handleChange={(e) => handleFormFieldChange('name', e)}
                />
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

                <div className="flex flex-col gap-[10px]">
                    <span className="font-epilogue font-medium text-[14px] leading-[22px] text-[#808191] mb-[10px]">Select Role</span>
                    <select
                        value={form.role}
                        onChange={(e) => handleFormFieldChange('role', e)}
                        className="py-[15px] sm:px-[25px] px-[15px] outline-none border-[1px] border-[#3a3a43] bg-transparent font-epilogue text-white text-[14px] placeholder:text-[#4b5264] rounded-[10px] sm:min-w-[300px]"
                    >
                        <option value="CONTRIBUTOR" className="text-black">Contributor (Backer)</option>
                        <option value="CREATOR" className="text-black">Creator (Fundraiser)</option>
                        <option value="ADMIN" className="text-black">Admin (Governance)</option>
                    </select>
                </div>

                <div className="flex justify-center items-center mt-[20px]">
                    <CustomButton
                        btnType="submit"
                        title="Sign Up"
                        styles="bg-[#1dc071] w-full"
                    />
                </div>

                <p className="font-epilogue font-normal text-[14px] text-[#808191] text-center mt-[10px]">
                    Already have an account? <Link to="/login" className="text-[#1dc071]">Log In</Link>
                </p>
            </form>
        </div>
    )
}

export default Signup
