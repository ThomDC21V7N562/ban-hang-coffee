document.addEventListener('DOMContentLoaded', () => {
    // 1. DOM Elements
    const customerListContainer = document.getElementById('customer-list');
    const searchInput = document.getElementById('customer-search-input');
    // const addCustomerBtn = document.getElementById('add-customer-btn'); // Không cần vì đã dùng thẻ <a> trong HTML

    // 2. Hàm Định dạng Tiền tệ
    function formatCurrency(amount) {
        return amount.toLocaleString('vi-VN') + 'đ';
    }
    
    // 3. Hàm Tải Khách hàng từ Local Storage
    function loadCustomers() {
        // Khởi tạo một vài khách hàng mẫu nếu Local Storage trống
        if (!localStorage.getItem('customers')) {
            const mockCustomers = [
                { id: 'CUST001', name: 'Trần Thị Hoa', phone: '0901234567', totalSpent: 150000, lastVisit: new Date().getTime() - 86400000 },
                { id: 'CUST002', name: 'Lê Văn Toàn', phone: '0919876543', totalSpent: 280000, lastVisit: new Date().getTime() - 3600000 },
                { id: 'CUST003', name: 'Nguyễn Thanh Tùng', phone: '0977112233', totalSpent: 50000, lastVisit: new Date().getTime() - (86400000 * 5) },
            ];
            localStorage.setItem('customers', JSON.stringify(mockCustomers));
        }

        const storedCustomersRaw = localStorage.getItem('customers');
        return storedCustomersRaw ? JSON.parse(storedCustomersRaw) : [];
    }

    let allCustomers = loadCustomers(); // Tải khách hàng ban đầu

    // 4. Hàm Render Danh sách Khách hàng
    function renderCustomerList(customersToDisplay) {
        customerListContainer.innerHTML = ''; // Xóa nội dung cũ

        if (customersToDisplay.length === 0) {
             customerListContainer.innerHTML = '<p style="text-align:center; color:#999; padding: 20px;">Không tìm thấy khách hàng nào.</p>';
             return;
        }

        customersToDisplay.forEach(customer => {
            // Đảm bảo trường lastVisit tồn tại trước khi dùng
            const lastVisitTimestamp = customer.lastVisit || new Date().getTime(); 
            const lastVisitDate = new Date(lastVisitTimestamp).toLocaleDateString('vi-VN');
            
            const customerItem = document.createElement('div');
            customerItem.className = 'customer-item';
            // Dữ liệu khách hàng được gắn vào dataset (hữu ích cho việc chỉnh sửa)
            customerItem.dataset.id = customer.id;
            
            // Thêm sự kiện click để mô phỏng "Xem/Sửa thông tin"
            customerItem.addEventListener('click', () => {
                 // Ở đây bạn có thể chuyển hướng đến trang chỉnh sửa: window.location.href = `add-customer.html?id=${customer.id}`;
                 alert(`Xem chi tiết/Sửa: ${customer.name}\nĐiện thoại: ${customer.phone}\nTổng chi tiêu: ${formatCurrency(customer.totalSpent || 0)}`);
            });

            customerItem.innerHTML = `
                <div class="customer-info">
                    <span class="customer-name">${customer.name}</span>
                    <span class="customer-phone">${customer.phone || 'Chưa cập nhật SĐT'}</span>
                </div>
                <div class="customer-stats">
                    <span class="total-spent">Tổng chi tiêu: ${formatCurrency(customer.totalSpent || 0)}</span>
                    <span class="last-visit">Lần cuối: ${lastVisitDate}</span>
                </div>
            `;
            customerListContainer.appendChild(customerItem);
        });
    }

    // 5. Xử lý Tìm kiếm (Khi người dùng gõ vào ô tìm kiếm)
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            
            const filteredCustomers = allCustomers.filter(customer => {
                // Tìm kiếm theo Tên HOẶC SĐT HOẶC Mã ID
                return (customer.name && customer.name.toLowerCase().includes(query)) || 
                       (customer.phone && customer.phone.includes(query)) ||
                       (customer.id && customer.id.toLowerCase().includes(query));
            });

            renderCustomerList(filteredCustomers);
        });
    }
    
    // Khởi tạo lần đầu: Hiển thị TẤT CẢ khách hàng
    renderCustomerList(allCustomers);
});