// --- Dữ liệu tài khoản Mockup (Mô phỏng) ---
const ACCOUNTS = {
    'admin': '123456',       // Tài khoản Admin
    'nhanvien': '654321'     // Tài khoản Nhân viên
};

// Tên file HTML của trang bán hàng (dựa trên cấu trúc file của bạn)
const SALES_PAGE_URL = 'desktop-pos.html'; 

document.getElementById('login-form').addEventListener('submit', function(event) {
    event.preventDefault(); // Ngăn chặn form submit truyền thống

    const usernameInput = document.getElementById('username').value;
    const passwordInput = document.getElementById('password').value;
    const errorMessage = document.getElementById('error-message');

    // --- Kiểm tra Đăng nhập ---
    if (ACCOUNTS[usernameInput] === passwordInput) {
        // Đăng nhập thành công

        // 1. Lưu trạng thái người dùng (rất quan trọng cho việc phân quyền)
        // Dùng localStorage để lưu trữ thông tin role
        let role = (usernameInput === 'admin') ? 'Admin' : 'NhanVien';
        localStorage.setItem('userRole', role);
        localStorage.setItem('currentUser', usernameInput);

        // 2. Chuyển hướng đến trang bán hàng
        window.location.href = SALES_PAGE_URL;
        
    } else {
        // Đăng nhập thất bại
        errorMessage.textContent = 'Tên đăng nhập hoặc mật khẩu không chính xác.';
    }
});