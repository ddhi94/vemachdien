# Circuit Sketcher (Vẽ Mạch Điện) - Project Overview & Roadmap

## 1. Tổng quan dự án (Project Overview)

`Circuit Sketcher` là một ứng dụng web tương tác hiện đại, được thiết kế chuyên biệt để hỗ trợ giáo dục và nghiên cứu trong lĩnh vực Vật lý (Điện học & Cơ học). Dự án không chỉ dừng lại ở việc vẽ hình mà còn hướng tới việc chuẩn hóa các sơ đồ theo chương trình giáo khoa (đặc biệt là tiêu chuẩn Việt Nam).

### Công nghệ cốt lõi:
- **Frontend Framework**: React 18 + TypeScript (Đảm bảo type-safe và hiệu năng cao).
- **Styling & UI**: Tailwind CSS + Shadcn UI (Giao diện hiện đại, chuyên nghiệp, hỗ trợ Dark Mode).
- **Rendering**: SVG (Đồ họa vector đảm bảo độ sắc nét cao khi in ấn hoặc xuất file).
- **Phân tích công thức (Parser)**: Sử dụng trình phân tích cú pháp đệ quy xuống (Recursive Descent Parser) để chuyển đổi các công thức mạch điện thành sơ đồ trực quan.

### Các tính năng chính hiện có:
- **Canvas Tương tác**: Kéo thả linh kiện, vẽ dây dẫn vuông góc (Orthogonal), tự động dính lưới (Snap to Grid).
- **Bộ linh kiện phong phú**: 
    - **Điện học**: Nguồn, điện trở, tụ điện, vôn kế, ampe kế, động cơ, máy phát...
    - **Cơ học**: Lò xo, ròng rọc, con lắc, mặt phẳng nghiêng, vectơ lực...
- **Vẽ bằng công thức**: Nhập công thức (ví dụ: `U nt K nt (R1 // R2)`) để tạo nhanh mạch điện phức tạp.
- **Tùy chỉnh linh hoạt**: Resize linh kiện (lò xo, con lắc), thay đổi giá trị, nhãn dán, độ dày nét vẽ.

---

## 2. Đánh giá tính kỹ thuật & Khả năng mở rộng

Dự án có cấu trúc mã nguồn tốt, phân tách rõ ràng giữa Logic (Hooks/Lib) và Giao diện (Components). 

### Điểm mạnh:
- **Tính chuẩn hóa**: Các ký hiệu được vẽ tỉ mỉ, đúng quy chuẩn giáo dục.
- **Hiệu suất UX**: Micro-animations và thiết kế Glassmorphism tạo cảm giác cao cấp.
- **Tính tùy biến**: Hệ thống cho phép người dùng điều chỉnh kích thước và góc độ của các linh kiện cơ học một cách trực quan.

### Khả năng phát triển:
- **Hệ thống Plugin**: Cấu trúc hiện tại dễ dàng thêm mới các loại linh kiện chỉ bằng cách thêm định nghĩa SVG và Type.
- **Export đa dạng**: Có tiềm năng xuất file PDF, SVG chất lượng cao cho đề thi hoặc giáo án.

---

## 3. Định hướng phát triển (Roadmap)

Dựa trên nền tảng hiện có, dự án có thể phát triển theo các hướng chiến lược sau:

### Giai đoạn 1: Nâng cao trải nghiệm Vẽ (Drafting & UX)
- **Hệ thống Layer**: Cho phép chèn ảnh nền (đề bài) để vẽ đè lên hoặc chú thích.
- **Group & Move**: Chọn nhiều linh kiện và di chuyển/xoay cùng lúc.
- **Smart Labels**: Nhãn dán tự động né dây dẫn và linh kiện để tránh trùng lặp.

### Giai đoạn 2: Mô phỏng & Tính toán (Simulation - QUAN TRỌNG)
- **Circuit Solver**: Tích hợp công cụ giải mạch (Định luật Ohm, Kirchhoff) để tính dòng điện/hiệu điện thế thực tế.
- **Hoạt ảnh dòng điện**: Hiển thị hướng di chuyển của electron hoặc độ sáng bóng đèn dựa trên dòng điện.
- **Cơ học động**: Chạy mô phỏng chuyển động (ròng rọc quay, vật trượt trên mặt phẳng nghiêng, dao động con lắc).

### Giai đoạn 3: Phân tích Dữ liệu & Đồ thị
- **Live Graphs**: Vẽ đồ thị I-U hoặc sự phụ thuộc của lực theo thời gian ngay trong ứng dụng (sử dụng Recharts).
- **Bảng số liệu**: Xuất bảng giá trị thực nghiệm từ các mạch đã thiết lập.

### Giai đoạn 4: Cộng đồng & Đám mây
- **Kho sơ đồ mẫu**: Chia sẻ và tải về các sơ đồ từ cộng đồng giáo viên.
- **Real-time Collaboration**: Nhiều người cùng chỉnh sửa một sơ đồ trong thời gian thực (phù hợp cho dạy học online).

---

## 4. Các chức năng có thể triển khai ngay (Quick Wins)
1. **In ấn & Xuất file**: Hoàn thiện tính năng xuất ảnh PNG/SVG sạch đẹp để giáo viên chèn vào Word/PowerPoint.
2. **Undo/Redo**: Nâng cấp hệ thống History để hoạt động mượt mà hơn với các tương tác phức tạp.
3. **Thư viện đề thi**: Lưu trữ các mẫu mạch điện phổ biến trong sách giáo khoa 6-12 vào menu "Mẫu sơ đồ".

---
*Báo cáo được tổng hợp để hỗ trợ định hướng phát triển dài hạn cho dự án Circuit Sketcher.*
