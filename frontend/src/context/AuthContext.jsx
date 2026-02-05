import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        try {
            const savedUser = localStorage.getItem('user');
            return savedUser ? JSON.parse(savedUser) : null;
        } catch (error) {
            console.error("Error parsing user from localStorage:", error);
            localStorage.removeItem('user');
            return null;
        }
    });

    const login = async (email, password) => {
        try {
            const { data } = await api.post('/auth/login', { email, password });
            setUser(data);
            localStorage.setItem('user', JSON.stringify(data));
            return { success: true };
        } catch (error) {
            console.error("Login failed:", error.response?.data?.message);
            return { success: false, message: error.response?.data?.message || "Login failed" };
        }
    };

    const signup = async (name, email, password, role) => {
        try {
            const { data } = await api.post('/auth/register', { name, email, password, role });
            setUser(data);
            localStorage.setItem('user', JSON.stringify(data));
            return { success: true };
        } catch (error) {
            console.error("Signup failed:", error.response?.data?.message);
            return { success: false, message: error.response?.data?.message || "Signup failed" };
        }
    }

    const logout = () => {
        setUser(null);
        localStorage.removeItem('user');
    };

    return (
        <AuthContext.Provider value={{ user, login, signup, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
