document.addEventListener('DOMContentLoaded', () => {
    // 1. DOM Elements
    const saveButton = document.querySelector('.save-btn');
    const customerForm = document.querySelector('.customer-form');

    // 2. Hàm Tải Khách hàng từ Local Storage
    function loadCustomers() {
        const storedCustomersRaw = localStorage.getItem('customers');
        return storedCustomersRaw ? JSON.parse(storedCustomersRaw) : [];
    }

    // 3. Hàm Tạo Mã Khách hàng Tự động
    function generateCustomerId(customers) {
        // Tìm ID số cao nhất hiện tại (ví dụ: CUST001, CUST002)
        let maxNumber = 0;
        customers.forEach(cust => {
            if (cust.id.startsWith('CUST')) {
                const num = parseInt(cust.id.replace('CUST', ''));
                if (!isNaN(num) && num > maxNumber) {
                    maxNumber = num;
                }
            }
        });
        
        // Tăng số lên 1 và định dạng lại (ví dụ: CUST003)
        const newNumber = maxNumber + 1;
        return 'CUST' + newNumber.toString().padStart(3, '0');
    }

    // 4. Xử lý sự kiện Lưu
    saveButton.addEventListener('click', () => {
        // Kiểm tra Form Validation cơ bản (Họ và tên bắt buộc)
        const fullNameInput = document.getElementById('full-name');
        if (!fullNameInput.value.trim()) {
            alert('Vui lòng nhập Họ và tên khách hàng.');
            fullNameInput.focus();
            return;
        }

        const existingCustomers = loadCustomers();
        const newCustomerId = generateCustomerId(existingCustomers);

        // Lấy dữ liệu từ form
        const newCustomer = {
            id: newCustomerId,
            name: fullNameInput.value.trim(),
            phone: document.getElementById('phone-1').value.trim(),
            phone2: document.getElementById('phone-2').value.trim(),
            dob: document.getElementById('dob').value,
            gender: document.getElementById('gender').value,
            // Thêm các trường khác (Địa chỉ, Ghi chú...) nếu có trong form
            totalSpent: 0, // Khách hàng mới, tổng chi tiêu ban đầu là 0
            lastVisit: new Date().getTime() // Ngày lưu là ngày ghé thăm cuối cùng
        };

        // Lưu khách hàng mới vào Local Storage
        existingCustomers.push(newCustomer);
        localStorage.setItem('customers', JSON.stringify(existingCustomers));

        alert(`Đã lưu khách hàng mới: ${newCustomer.name} (Mã: ${newCustomer.id})`);
        
        // Sau khi lưu, chuyển hướng về trang POS bán hàng
        window.location.href = 'desktop-pos.html'; 
    });
    
    // 5. Cập nhật mã khách hàng tự động khi trang tải
    const existingCustomers = loadCustomers();
    const autoCodeInput = document.getElementById('customer-code');
    if(autoCodeInput) {
        autoCodeInput.value = generateCustomerId(existingCustomers);
    }
});