document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. KHAI BÁO DOM ---
    const timeFilterBtn = document.getElementById('time-filter-btn');
    const timeFilterMenu = document.getElementById('time-filter-menu');
    const invoiceListDisplay = document.getElementById('invoice-list-display');
    const totalRevenueDisplay = document.getElementById('total-revenue');
    const invoiceCountDisplay = document.getElementById('invoice-count');

    // --- 2. HÀM PHỤ TRỢ ---
    function formatCurrency(amount) {
        // Đảm bảo amount là số trước khi định dạng
        const numericAmount = typeof amount === 'number' ? amount : 0;
        return numericAmount.toLocaleString('vi-VN') + 'đ';
    }

    // Lấy dữ liệu từ localStorage
    function loadInvoices() {
        // CHÚ Ý: Đảm bảo key trong localStorage của bạn là 'invoices' (giống như POS code)
        // Nếu bạn dùng key là 'userInvoices', hãy đổi thành 'invoices' trong file POS.
        const storedInvoicesRaw = localStorage.getItem('invoices'); 
        const storedInvoices = JSON.parse(storedInvoicesRaw) || [];
        
        // Sắp xếp theo ngày giảm dần ngay khi tải
        storedInvoices.sort((a, b) => new Date(b.date) - new Date(a.date));

        return storedInvoices.map(invoice => ({
            ...invoice,
            // Đảm bảo date là đối tượng Date để so sánh
            date: new Date(invoice.date) 
        }));
    }

    // --- 3. LỌC HÓA ĐƠN (ĐÃ SỬA LỖI LOGIC DATE) ---
    function filterInvoices(filterType, invoices) {
        const now = new Date();
        let startDate = new Date(0); // Mặc định là 'Toàn thời gian'
        let endDate = new Date(now.getTime() + 1000); // Kết thúc đến hiện tại

        switch (filterType) {
            case 'today':
                startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
                endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
                break;
            case 'yesterday':
                // Tạo ngày hôm qua
                const yesterday = new Date(now);
                yesterday.setDate(now.getDate() - 1);
                
                startDate = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 0, 0, 0, 0);
                endDate = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59, 999);
                break;
            case 'last-7-days':
                startDate = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
                startDate.setHours(0, 0, 0, 0); // Bắt đầu từ 7 ngày trước
                break;
            case 'this-month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
                break;
            case 'last-month':
                // Tính toán tháng trước
                const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
                const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
                
                startDate = lastMonthStart;
                endDate = lastMonthEnd;
                break;
            case 'all':
            default:
                startDate = new Date(0); 
                break;
        }

        return invoices.filter(invoice => 
            invoice.date.getTime() >= startDate.getTime() && 
            invoice.date.getTime() <= endDate.getTime()
        );
    }

    // --- 4. TÍNH TOÁN VÀ HIỂN THỊ THỐNG KÊ ---
    function updateStats(filteredInvoices) {
        const totalRevenue = filteredInvoices.reduce((sum, invoice) => sum + invoice.total, 0);
        const invoiceCount = filteredInvoices.length;

        totalRevenueDisplay.textContent = formatCurrency(totalRevenue);
        invoiceCountDisplay.textContent = `${invoiceCount} hóa đơn`;

        renderInvoiceList(filteredInvoices);
    }

    // --- 5. HIỂN THỊ DANH SÁCH HÓA ĐƠN ---
    function renderInvoiceList(invoices) {
        invoiceListDisplay.innerHTML = '';

        if (invoices.length === 0) {
            invoiceListDisplay.innerHTML = '<p>Không có hóa đơn nào trong khoảng thời gian này.</p>';
            return;
        }

        // Nhóm hóa đơn theo ngày (Quan trọng: Đã sắp xếp theo thời gian mới nhất ở loadInvoices)
        const groupedInvoices = invoices.reduce((groups, invoice) => {
            // Lấy ngày (không kèm giờ)
            const dateKey = new Date(invoice.date.getFullYear(), invoice.date.getMonth(), invoice.date.getDate()).toDateString();
            if (!groups[dateKey]) {
                groups[dateKey] = [];
            }
            groups[dateKey].push(invoice);
            return groups;
        }, {});

        // Hiển thị các nhóm hóa đơn
        Object.keys(groupedInvoices).forEach(dateStr => {
            const dateGroup = document.createElement('div');
            dateGroup.className = 'invoice-group';

            // Định dạng lại tên ngày (ví dụ: 'Thứ Ba, 21/11/2025')
            const displayDate = groupedInvoices[dateStr][0].date.toLocaleDateString('vi-VN', {
                 weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' 
            });
            dateGroup.innerHTML = `<div class="invoice-section-title">${displayDate}</div>`;

            groupedInvoices[dateStr].forEach(inv => {
                const item = document.createElement('div');
                // Gắn data-id để sau này có thể mở chi tiết
                item.className = 'invoice-item';
                item.dataset.invoiceId = inv.id;

                const statusHtml = inv.status === 'pending' 
                    ? `<span class="invoice-status pending">Đang chờ</span>` 
                    : `<span class="invoice-status completed">Đã hoàn thành</span>`;

                item.innerHTML = `
                    <div class="invoice-details">
                        <span class="customer-name">${inv.customer}</span>
                        <span class="invoice-info">
                            ${inv.date.toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})} • 
                            <span class="invoice-code">${inv.id}</span>
                        </span>
                    </div>
                    <div class="invoice-summary">
                        <span class="invoice-total">${formatCurrency(inv.total)}</span>
                        ${statusHtml}
                    </div>
                `;

                // Thêm sự kiện click để xem chi tiết (chưa code chi tiết)
                item.addEventListener('click', () => {
                     // alert(`Xem chi tiết hóa đơn: ${inv.id}`); 
                     // Thêm hàm hiển thị modal chi tiết ở đây
                });

                dateGroup.appendChild(item);
            });

            invoiceListDisplay.appendChild(dateGroup);
        });
    }

    // --- 6. XỬ LÝ SỰ KIỆN LỌC THỜI GIAN ---
    
    // Toggle menu
    if (timeFilterBtn && timeFilterMenu) {
        timeFilterBtn.addEventListener('click', (e) => {
            timeFilterMenu.classList.toggle('show');
            e.stopPropagation(); // Ngăn sự kiện click lan truyền ra ngoài
        });
    }

    // Xử lý khi chọn bộ lọc
    if (timeFilterMenu) {
        timeFilterMenu.querySelectorAll('button').forEach(button => {
            button.addEventListener('click', (e) => {
                const filterType = e.target.dataset.filter;
                
                // 1. Cập nhật trạng thái active
                timeFilterMenu.querySelectorAll('button').forEach(btn => btn.classList.remove('active'));
                e.target.classList.add('active');

                // 2. Cập nhật hiển thị nút chính
                timeFilterBtn.innerHTML = `${e.target.textContent} <i class="fas fa-chevron-down"></i>`;
                
                // 3. Ẩn menu và gọi hàm render
                timeFilterMenu.classList.remove('show');
                
                const invoices = loadInvoices();
                const filteredInvoices = filterInvoices(filterType, invoices);
                updateStats(filteredInvoices);
            });
        });
    }

    // Đóng menu khi click ra ngoài
    document.addEventListener('click', () => {
        if (timeFilterMenu) timeFilterMenu.classList.remove('show');
    });

    // --- 7. KHỞI TẠO BAN ĐẦU ---
    // Khởi tạo trạng thái mặc định: 'this-month' (Tháng này)
    const defaultFilter = 'this-month';
    const defaultBtn = document.querySelector(`button[data-filter="${defaultFilter}"]`);
    
    // Đặt nút 'Tháng này' là active và cập nhật nút hiển thị
    if (defaultBtn) {
        defaultBtn.classList.add('active');
        timeFilterBtn.innerHTML = `${defaultBtn.textContent} <i class="fas fa-chevron-down"></i>`;
    }

    const initialInvoices = loadInvoices();
    const initialFilteredInvoices = filterInvoices(defaultFilter, initialInvoices);
    updateStats(initialFilteredInvoices);
});