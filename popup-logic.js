// 导航菜单切换
const navItems = document.querySelectorAll('.nav-item');
const contentSections = document.querySelectorAll('.content-section');

navItems.forEach(item => {
    item.addEventListener('click', () => {
        // 移除所有活动状态
        navItems.forEach(nav => nav.classList.remove('active'));
        contentSections.forEach(section => section.classList.remove('active'));
        
        // 添加当前活动状态
        item.classList.add('active');
        const sectionId = item.dataset.section;
        const section = document.getElementById(sectionId);
        if (section) section.classList.add('active');
    });
});