document.addEventListener('DOMContentLoaded', () => {
    // 1. Dữ liệu sản phẩm
    const products = [
        { id: 'SP001', name: 'Cà Phê Đen Đá', price: 25000, category: 'ca-phe', icon: 'fas fa-mug-hot' },
        { id: 'SP002', name: 'Latte Nóng/Lạnh', price: 45000, category: 'ca-phe', icon: 'fas fa-coffee' },
        { id: 'SP003', name: 'Trà Đào Cam Sả', price: 38000, category: 'tra', icon: 'fas fa-lemon' },
        { id: 'SP004', name: 'Trà Sen Vàng', price: 40000, category: 'tra', icon: 'fas fa-leaf' },
        { id: 'SP005', name: 'Sinh Tố Bơ', price: 55000, category: 'sinh-to', icon: 'fas fa-blender' },
        { id: 'SP006', name: 'Bánh Mousse Chanh Leo', price: 45000, category: 'banh', icon: 'fas fa-birthday-cake' },
        { id: 'SP007', name: 'Americano', price: 35000, category: 'ca-phe', icon: 'fas fa-mug-hot' },
        { id: 'SP008', name: 'Nước Ép Cam', price: 45000, category: 'tra', icon: 'fas fa-glass-water' },
    ];

    // 2. Biến lưu trữ đơn hàng hiện tại
    let currentOrder = {}; 

    // 3. Các khu vực DOM
    const productGrid = document.getElementById('product-list');
    const orderList = document.getElementById('current-order-list');
    const subtotalDisplay = document.getElementById('subtotal');
    const totalAmountDisplay = document.getElementById('total-amount');
    const checkoutBtn = document.getElementById('checkout-btn');

    // 4. Hàm định dạng tiền tệ
    function formatCurrency(amount) {
        return amount.toLocaleString('vi-VN') + 'đ';
    }

    // 5. Hàm render danh sách sản phẩm
    function renderProductGrid() {
        productGrid.innerHTML = '';
        products.forEach(product => {
            const item = document.createElement('button');
            item.className = 'product-item';
            item.dataset.id = product.id;
            item.innerHTML = `
                <i class="${product.icon}"></i>
                <span>${product.name}</span>
                <span class="price">${formatCurrency(product.price)}</span>
            `;
            item.addEventListener('click', () => addToOrder(product));
            productGrid.appendChild(item);
        });
    }

    // 6. Hàm thêm sản phẩm vào đơn hàng
    function addToOrder(product) {
        if (currentOrder[product.id]) {
            currentOrder[product.id].quantity += 1;
        } else {
            currentOrder[product.id] = { id: product.id, name: product.name, price: product.price, quantity: 1 };
        }
        updateOrderList();
    }

    // 7. Hàm cập nhật danh sách đơn hàng và tổng tiền
    function updateOrderList() {
        orderList.innerHTML = '';
        let currentSubtotal = 0;
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
                <div class="item-total">${formatCurrency(total)}</div>
            `;
            orderList.appendChild(li);
        });

        subtotalDisplay.textContent = formatCurrency(currentSubtotal);
        totalAmountDisplay.textContent = formatCurrency(currentSubtotal);
    }

    // 8. Hàm tạo mã hóa đơn mới
    function generateInvoiceId(storedInvoices) {
        const today = new Date();
        const dateStr = `${today.getFullYear()}${(today.getMonth() + 1).toString().padStart(2, '0')}${today.getDate().toString().padStart(2, '0')}`;
        const prefix = `HD${dateStr}-`;

        let lastNumber = 0;
        storedInvoices.forEach(inv => {
            if (inv.id && inv.id.startsWith(prefix)) {
                const currentNumber = parseInt(inv.id.split('-').pop());
                if (!isNaN(currentNumber) && currentNumber > lastNumber) {
                    lastNumber = currentNumber;
                }
            }
        });

        lastNumber = lastNumber < 500 ? 500 : lastNumber + 1;
        const newNumberStr = lastNumber.toString().padStart(3, '0');
        return `${prefix}${newNumberStr}`;
    }

    // 9. Hàm lưu hóa đơn vào localStorage
    function saveInvoice(orderItems, totalAmount) {
        const storedInvoicesRaw = localStorage.getItem('userInvoices');
        const storedInvoices = JSON.parse(storedInvoicesRaw) || [];

        const newInvoiceId = generateInvoiceId(storedInvoices);

        const invoice = {
            id: newInvoiceId,
            date: new Date().getTime(),
            customer: 'Khách lẻ',
            total: totalAmount,
            status: 'completed',
            items: orderItems
        };

        storedInvoices.unshift(invoice);
        localStorage.setItem('userInvoices', JSON.stringify(storedInvoices));
        return invoice;
    }

    // 10. Xử lý nút thanh toán
    checkoutBtn.addEventListener('click', () => {
        const orderItems = Object.values(currentOrder).map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            total: item.price * item.quantity
        }));

        const total = orderItems.reduce((sum, item) => sum + item.total, 0);

        if (total > 0) {
            saveInvoice(orderItems, total);
            alert(`Xác nhận thanh toán ${formatCurrency(total)}. Cảm ơn quý khách!`);
            currentOrder = {}; 
            updateOrderList();
            window.location.href = 'hoa-don.html'; 
        } else {
            alert('Đơn hàng trống. Vui lòng chọn sản phẩm.');
        }
    });

    // Khởi tạo trang sản phẩm
    renderProductGrid();
});
