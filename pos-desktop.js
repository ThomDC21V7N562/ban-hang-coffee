// =========================================================================
// --- 1. BIẾN GLOBAL VÀ HÀM PHỤ TRỢ (Khai báo ngoài DOMContentLoaded) ---
// =========================================================================

// Biến lưu trữ giá trị giảm giá (mặc định 0%)
let discountPercent = 0; 
let currentCustomer = { id: 'KhachLe', name: 'Khách hàng' }; 
let currentUsername = localStorage.getItem('currentUser');
let userRole = localStorage.getItem('userRole');

// Hàm Định dạng tiền tệ
function formatCurrency(amount) {
    return amount.toLocaleString('vi-VN') + 'đ';
}

// Hàm Đăng Xuất (được gọi từ HTML qua sự kiện onclick)
function logout() {
    const confirmation = confirm(`
        Xác nhận Đăng Xuất?
        
        Tài khoản hiện tại: ${currentUsername}
        Vai trò: ${userRole}
    `);

    if (confirmation) {
        localStorage.removeItem('userRole');
        localStorage.removeItem('currentUser');
        window.location.href = 'login.html'; // Quay lại trang đăng nhập
    }
}

// Hàm tạo ID hóa đơn mới
function generateInvoiceId() {
    const lastId = localStorage.getItem('lastInvoiceId') || 0;
    const newId = parseInt(lastId) + 1;
    localStorage.setItem('lastInvoiceId', newId);
    return 'HD' + String(newId).padStart(5, '0'); // Ví dụ: HD00001
}

// Hàm tải danh sách khách hàng (Dùng chung cho cả logic POS và SaveInvoice)
function loadCustomers() {
    const storedCustomersRaw = localStorage.getItem('customers');
    let customers = storedCustomersRaw ? JSON.parse(storedCustomersRaw) : [];
    
    if (customers.length === 0) {
        // Dữ liệu mẫu ban đầu
        customers = [
            { id: 'CUST001', name: 'Trần Thị Hoa', phone: '0901234567', totalSpent: 150000, lastVisit: new Date().getTime() - 86400000 },
            { id: 'CUST002', name: 'Lê Văn Toàn', phone: '0919876543', totalSpent: 280000, lastVisit: new Date().getTime() - 3600000 },
        ];
        localStorage.setItem('customers', JSON.stringify(customers));
    }
    return customers;
}

// =========================================================================
// --- 2. LOGIC CHÍNH (Chạy khi DOM đã tải xong) ---
// =========================================================================

document.addEventListener('DOMContentLoaded', () => {
    
    // --- KHAI BÁO DOM ---
    const productGrid = document.getElementById('product-list');
    const orderList = document.getElementById('current-order-list');
    const subtotalDisplay = document.getElementById('subtotal');
    const discountDisplay = document.getElementById('discount');
    const totalAmountDisplay = document.getElementById('total-amount');
    const searchInput = document.getElementById('search-input');
    const categoryTabsContainer = document.querySelector('.category-tabs');
    const categoryTabs = categoryTabsContainer ? categoryTabsContainer.querySelectorAll('.tab-btn') : [];
    const customerSearchInput = document.getElementById('customer-search-input');
    const searchResultsDiv = document.getElementById('customer-search-results');
    const clearCustomerBtn = document.getElementById('clear-customer-btn');
    const discountInput = document.getElementById('discount-percent-input');
    const applyDiscountBtn = document.getElementById('apply-discount-btn');
    const checkoutBtn = document.getElementById('checkout-btn'); // Nút THANH TOÁN
    const welcomeText = document.getElementById('welcome-user');
    
    
    // --- PHÂN QUYỀN VÀ KIỂM TRA ĐĂNG NHẬP ---
    if (!userRole) {
        alert('Phiên làm việc hết hạn. Vui lòng đăng nhập lại.');
        window.location.href = 'login.html'; 
        return; 
    } 
    
    // Hiển thị tên người dùng và vai trò
    if (welcomeText) {
        welcomeText.innerHTML = `<i class="fas fa-user-circle"></i> ${currentUsername} (${userRole})`;
    }
    
    // Phân quyền: Ẩn nút "Thêm Sản Phẩm Mới"
    if (userRole === 'NhanVien') {
        const addProductButton = document.getElementById('btn-add-product');
        if (addProductButton) {
            addProductButton.style.display = 'none';
        }
    }
    
    // 1. Dữ liệu sản phẩm MẪU
   function loadAllProducts() {
    const defaultProducts = [
        { id: 'SP001', name: 'Cà Phê Đen Đá', price: 25000, category: 'ca-phe', icon: 'fas fa-mug-hot' },
        { id: 'SP002', name: 'Latte Nóng/Lạnh', price: 45000, category: 'ca-phe', icon: 'fas fa-coffee' },
        { id: 'SP003', name: 'Trà Đào Cam Sả', price: 38000, category: 'tra', icon: 'fas fa-lemon' },
        { id: 'SP004', name: 'Trà Sen Vàng', price: 40000, category: 'tra', icon: 'fas fa-leaf' },
        { id: 'SP005', name: 'Sinh Tố Bơ', price: 55000, category: 'sinh-to', icon: 'fas fa-blender' },
        { id: 'SP006', name: 'Bánh Mousse Chanh Leo', price: 45000, category: 'banh', icon: 'fas fa-birthday-cake' },
        { id: 'SP007', name: 'Americano', price: 35000, category: 'ca-phe', icon: 'fas fa-mug-hot' },
        { id: 'SP008', name: 'Nước Ép Cam', price: 45000, category: 'tra', icon: 'fas fa-glass-water' },
    ];

    // Lấy sản phẩm mới từ Local Storage
    const storedProductsRaw = localStorage.getItem('products');
    let newProducts = storedProductsRaw ? JSON.parse(storedProductsRaw) : [];

    // Cần thêm icon mặc định cho sản phẩm mới nếu chúng không có
    newProducts = newProducts.map(p => ({
        ...p,
        // Đảm bảo có thuộc tính icon và price là số
        icon: p.imageUrl ? '' : 'fas fa-concierge-bell', // Dùng icon chuông nếu không có ảnh Base64
        price: parseFloat(p.price)
    }));
    
    // Gộp sản phẩm mặc định và sản phẩm mới (ưu tiên sản phẩm mới)
    // Loại bỏ sản phẩm mặc định nếu có ID trùng với sản phẩm mới
    const combinedProducts = [
        ...defaultProducts.filter(d => !newProducts.some(n => n.id === d.id)),
        ...newProducts
    ];

    return combinedProducts;
   }
    // 2. Biến lưu trữ đơn hàng hiện tại
    let currentOrder = {}; 
    
    
    // ----------------------------------------------------
    // START: HÀM CẬP NHẬT GIAO DIỆN KHÁCH HÀNG
    // ----------------------------------------------------

    function updateCustomerDisplay() {
        const customerDisplayElement = document.getElementById('customer-display');
        const searchArea = document.querySelector('.customer-search-area');
        const clearBtn = document.getElementById('clear-customer-btn');
        
        if (customerDisplayElement) {
            customerDisplayElement.textContent = currentCustomer.name; 
        }

        if (currentCustomer.id === 'KhachLe') {
            if (searchArea) searchArea.style.display = 'block';
            if (clearBtn) clearBtn.style.display = 'none';
        } else {
            if (searchArea) searchArea.style.display = 'none';
            if (clearBtn) clearBtn.style.display = 'inline-block';
        }
        
        const searchResultsDiv = document.getElementById('customer-search-results');
        if (searchResultsDiv) searchResultsDiv.style.display = 'none';
    }

    // ----------------------------------------------------
    // END: HÀM CẬP NHẬT GIAO DIỆN KHÁCH HÀNG
    // ----------------------------------------------------
    
    
    // ----------------------------------------------------
    // START: HÀM TÍNH TOÁN VÀ RENDER ĐƠN HÀNG
    // ----------------------------------------------------

 function renderProductGrid(filter = '') {
    if (!productGrid) return;
    productGrid.innerHTML = '';
    const [type, value] = filter.split(':');

    // Dùng hàm loadAllProducts thay vì biến 'products' tĩnh
    const allProducts = loadAllProducts(); 

    const filteredProducts = allProducts.filter(product => {
        if (type === 'category' && value !== 'all') {
            return product.category === value;
        }
        if (type === 'search' && value) {
            return product.name.toLowerCase().includes(value.toLowerCase()) || 
                            product.code.toLowerCase().includes(value.toLowerCase()); // Thay 'id' bằng 'code'
        }
        return true;
    });

    filteredProducts.forEach(product => {
        const item = document.createElement('button');
        item.className = 'product-item';
        // Ta dùng ID được tạo từ Date.now()
        item.dataset.id = product.id; 
        
        // Kiểm tra xem sản phẩm có ảnh Base64 không (là sản phẩm mới)
        const isImage = product.imageUrl && product.imageUrl.startsWith('data:');
        const imageContent = isImage 
                             ? `<img src="${product.imageUrl}" alt="${product.name}" class="product-img">`
                             : `<i class="${product.icon}"></i>`; // Icon nếu là sản phẩm mặc định

        item.innerHTML = `
            ${imageContent}
            <span>${product.name}</span>
            <span class="product-id-code">${product.code || product.id}</span> 
            <span class="price">${formatCurrency(product.price)}</span>
        `;
        item.addEventListener('click', () => addToOrder(product));
        productGrid.appendChild(item);
    });
}
    function addToOrder(product) {
        if (currentOrder[product.id]) {
            currentOrder[product.id].quantity += 1;
        } else {
            currentOrder[product.id] = { id: product.id, name: product.name, price: product.price, quantity: 1 };
        }
        updateOrderList();
    }

    // HÀM CẬP NHẬT ĐƠN HÀNG VÀ TÍNH TỔNG/GIẢM GIÁ
    function updateOrderList() {
        if (!orderList) return;
        orderList.innerHTML = '';
        let currentSubtotal = 0; // Tạm tính

        Object.values(currentOrder).forEach(item => {
            const total = item.price * item.quantity;
            currentSubtotal += total;

            const li = document.createElement('li');
            li.className = 'order-item';
            
            li.innerHTML = `
                <div class="item-name">${item.name}</div>
                <div class="item-quantity">
                    <button class="qty-btn minus-btn" data-id="${item.id}">-</button>
                    <input type="number" class="item-quantity-input" value="${item.quantity}" readonly>
                    <button class="qty-btn plus-btn" data-id="${item.id}">+</button>
                </div>
                <div class="item-total" data-price="${item.price}">${formatCurrency(total)}</div>
            `;
            orderList.appendChild(li);
        });

        // 1. Tính giá trị tiền được giảm
        const discountAmount = currentSubtotal * (discountPercent / 100);

        // 2. Tính Tổng Cộng cuối cùng
        const finalTotal = currentSubtotal - discountAmount;
        
        // Cập nhật hiển thị lên giao diện
        if (subtotalDisplay) subtotalDisplay.textContent = formatCurrency(currentSubtotal);
        if (discountDisplay) discountDisplay.textContent = `-${formatCurrency(discountAmount)}`; 
        if (totalAmountDisplay) totalAmountDisplay.textContent = formatCurrency(finalTotal); 

        // Gắn sự kiện tăng giảm số lượng
        orderList.querySelectorAll('.qty-btn').forEach(btn => {
            btn.addEventListener('click', (e) => handleQuantityChange(e.target.dataset.id, btn.classList.contains('plus-btn')));
        });
    }
    
    function handleQuantityChange(id, isIncrease) {
        if (currentOrder[id]) {
            if (isIncrease) {
                currentOrder[id].quantity += 1;
            } else {
                currentOrder[id].quantity -= 1;
                if (currentOrder[id].quantity <= 0) {
                    delete currentOrder[id]; 
                }
            }
            updateOrderList();
        }
    }
    
    // ----------------------------------------------------
    // END: HÀM TÍNH TOÁN VÀ RENDER ĐƠN HÀNG
    // ----------------------------------------------------


    // ----------------------------------------------------
    // START: XỬ LÝ SỰ KIỆN NÚT VÀ INPUT
    // ----------------------------------------------------

    // LOGIC ÁP DỤNG GIẢM GIÁ (%)
    if (applyDiscountBtn && discountInput) {
        applyDiscountBtn.addEventListener('click', () => {
            let newDiscount = parseInt(discountInput.value);
            
            if (isNaN(newDiscount) || newDiscount < 0) {
                newDiscount = 0;
            } else if (newDiscount > 100) {
                newDiscount = 100;
            }
            
            discountPercent = newDiscount;
            discountInput.value = discountPercent;
            updateOrderList(); // Gọi lại để tính toán lại tổng tiền
        });
    }

    // XỬ LÝ TÌM KIẾM SẢN PHẨM
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            renderProductGrid(`search:${e.target.value}`);
        });
    }

    // XỬ LÝ CHUYỂN TAB DANH MỤC
    if (categoryTabs.length > 0) {
        categoryTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                categoryTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                renderProductGrid(`category:${tab.dataset.category}`);
            });
        });
    }

    // XỬ LÝ NÚT THANH TOÁN
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            const orderItems = Object.values(currentOrder).map(item => ({
                id: item.id,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                total: item.price * item.quantity
            }));
            
            const subtotal = orderItems.reduce((sum, item) => sum + item.total, 0);
            const discountAmount = subtotal * (discountPercent / 100);
            const totalAfterDiscount = subtotal - discountAmount;

            if (totalAfterDiscount > 0) {
                saveInvoice(orderItems, totalAfterDiscount);
                alert(`Xác nhận thanh toán ${formatCurrency(totalAfterDiscount)}. Hóa đơn cho: ${currentCustomer.name}`);
                
                // Reset sau khi thanh toán
                currentOrder = {}; 
                currentCustomer = { id: 'KhachLe', name: 'Khách hàng' };
                discountPercent = 0; 
                discountInput.value = 0; // Reset input giảm giá
                
                updateOrderList();
                updateCustomerDisplay();
                
                window.location.href = 'hoa-don.html'; // Chuyển trang sau khi lưu
            } else {
                alert('Đơn hàng trống. Vui lòng chọn sản phẩm.');
            }
        });
    }

    // ----------------------------------------------------
    // END: XỬ LÝ SỰ KIỆN NÚT VÀ INPUT
    // ----------------------------------------------------


    // ----------------------------------------------------
    // START: HÀM QUẢN LÝ HÓA ĐƠN VÀ TÌM KIẾM KHÁCH HÀNG
    // ----------------------------------------------------
    
    // Hàm Lưu Hóa Đơn vào Local Storage
    function saveInvoice(items, finalTotal) {
        const invoicesRaw = localStorage.getItem('invoices');
        let invoices = JSON.parse(invoicesRaw) || [];
        
        const newInvoice = {
            id: generateInvoiceId(),
            date: new Date().toISOString(),
            customer: currentCustomer.name,
            customerID: currentCustomer.id,
            items: items,
            subtotal: items.reduce((sum, item) => sum + item.total, 0),
            discountPercent: discountPercent,
            total: finalTotal,
            cashier: currentUsername || 'Admin',
        };
        
        invoices.push(newInvoice);
        localStorage.setItem('invoices', JSON.stringify(invoices));
        
        // Cập nhật chi tiêu cho khách hàng
        if (currentCustomer.id !== 'KhachLe') {
            let customers = loadCustomers(); 
            const customerIndex = customers.findIndex(c => c.id === currentCustomer.id);
            if (customerIndex !== -1) {
                customers[customerIndex].totalSpent = (customers[customerIndex].totalSpent || 0) + finalTotal;
                localStorage.setItem('customers', JSON.stringify(customers));
            }
        }
    }

    // LOGIC TÌM KIẾM KHÁCH HÀNG
    if (customerSearchInput && searchResultsDiv) {
        customerSearchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();
            searchResultsDiv.innerHTML = '';
            
            if (query.length < 2) {
                searchResultsDiv.style.display = 'none';
                return;
            }

            const customers = loadCustomers();
            const results = customers.filter(c => 
                c.name.toLowerCase().includes(query) || (c.phone && c.phone.includes(query))
            );

            if (results.length > 0) {
                results.forEach(customer => {
                    const item = document.createElement('div');
                    item.className = 'search-result-item';
                    item.innerHTML = `
                        <strong>${customer.name}</strong> 
                        <span>(${customer.phone})</span>
                    `;
                    item.addEventListener('click', () => {
                        currentCustomer = { id: customer.id, name: customer.name };
                        updateCustomerDisplay();
                        searchResultsDiv.style.display = 'none';
                        customerSearchInput.value = '';
                    });
                    searchResultsDiv.appendChild(item);
                });
                searchResultsDiv.style.display = 'block';
            } else {
                searchResultsDiv.style.display = 'none';
            }
        });
    }

    // Xử lý khi click vào nút xóa khách hàng (Reset về Khách lẻ)
    if (clearCustomerBtn) {
        clearCustomerBtn.addEventListener('click', () => {
            currentCustomer = { id: 'KhachLe', name: 'Khách hàng' };
            updateCustomerDisplay();
        });
    }
    
    // ----------------------------------------------------
    // END: HÀM QUẢN LÝ HÓA ĐƠN VÀ TÌM KIẾM KHÁCH HÀNG
    // ----------------------------------------------------


    // --- KHỞI TẠO LẦN ĐẦU ---
    renderProductGrid('category:all');
    updateCustomerDisplay(); 
    updateOrderList(); 
});