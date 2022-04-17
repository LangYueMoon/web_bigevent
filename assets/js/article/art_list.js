$(function() {
    var layer = layui.layer;
    var form = layui.form;
    var laypage = layui.laypage;

    // 定义时间格式美化过滤器
    template.defaults.imports.dataFormat = function(date) {
        const dt = new Date(date);

        var y = dt.getFullYear();
        var m = padZero(dt.getMonth() + 1);
        var d = padZero(dt.getDate());

        var hh = padZero(dt.getHours());
        var mm = padZero(dt.getMinutes());
        var ss = padZero(dt.getSeconds());

        return y + '-' + m + '-' + d + ' ' + hh + ':' + mm + ':' + ss;
    };
    // 定义时间补零函数
    function padZero(n) {
        return n > 9 ? n : '0' + n;
    }

    // 定义查询的参数对象（合集）
    // 发起请求时用于提交到服务器的参数
    var q = {
        // 当前页码
        pagenum: 1,
        // 每页显示数据条数
        pagesize: 2,
        // 文章分类 Id
        cate_id: '',
        // 文章发布状态
        state: ''
    };

    initTable();
    initCate();

    // 获取文章列表的方法
    function initTable() {
        $.ajax({
            url: '/my/article/list',
            method: 'GET',
            data: q,
            success: function(res) {
                if (res.status !== 0) {
                    return layer.msg('获取文章列表失败（请求失败）')
                }
                // 使用模板引擎渲染页面
                var htmlStr = template('tpl-table', res);
                $('tbody').html(htmlStr);
                // 渲染条数、分页、页码等信息
                renderPage(res.total);
            }
        })
    }

    // 获取文章分类数据的方法
    function initCate() {
        $.ajax({
            url: '/my/article/cates',
            method: 'GET',
            success: function(res) {
                if (res.status !== 0) {
                    return layer.msg('获取文章分类数据失败');
                }
                // 使用模板引擎渲染下拉菜单
                var htmlStr = template('tpl-cate', res);
                $('[name="cate_id"]').html(htmlStr);
                // 通过 layui 重新渲染下拉菜单的 UI 结构
                form.render();
            }
        })
    }

    // 为筛选表单绑定 submit 事件
    $('#form-search').on('submit', function(e) {
        e.preventDefault();
        // 获取下拉菜单中的值
        var cate_id = $('[name="cate_id"]').val();
        var state = $('[name="state"]').val();
        // 为查询的参数对象 q 对应属性赋值
        q.cate_id = cate_id;
        q.state = state;
        // 根据最新筛选条件重新渲染列表
        initTable();
    })

    // 定义渲染条数、分页、页码等信息的方法
    function renderPage(total) {
        // 调用 layui.laypage.render() 渲染页面
        laypage.render({
            // （标签）容器 ID 或者 DOM 对象
            elem: 'pageBox',
            // 数据总条数
            count: total,
            // 每页显示数据条数
            limit: q.pagesize,
            // 可选项（每页显示数据条数）
            limits: [2, 3, 5, 7, 11],
            // 当前页码
            curr: q.pagenum,
            // 内容排版
            layout: ['count', 'limit', 'prev', 'page', 'next', 'skip'],
            // 切换分页的回调
            jump: function(obj, first) {
                // 切换分页需要返回分页等信息至后台重新渲染页面
                q.pagenum = obj.curr;
                q.pagesize = obj.limit;

                // 重新请求服务器
                // 上传参数
                // 得到返回数据
                // 重新渲染列表

                // initTable() 中有调用 renderPage() 注意死循环问题
                // first 若是手动调用 layui.render() 则为 true
                // first 若是修改分页等信息后由 layui 脚本调用 则不为 true
                if (!first) {
                    initTable();
                }
            }
        });
    }

    // 通过事件代理，为删除按钮绑定 click 事件
    $('tbody').on('click', '.btn-delete', function() {
        // 获取删除按钮（文章）个数
        var num = $('.btn-delete').length;
        var Id = $(this).attr('data-id');
        // 询问用户是否确定删除
        layer.confirm('确认删除', { icon: 3, title: '提示' }, function(index) {
            $.ajax({
                url: '/my/article/delete/' + Id,
                method: 'GET',
                success: function(res) {
                    if (res.status !== 0) {
                        return layer.msg('删除文章失败');
                    }
                    layer.msg('删除文章成功');

                    // 删除成功后需要判断当前页码是否剩余文章并进行相应操作
                    if (num === 1) {
                        // 因为页面未刷新
                        // 删除按钮仍在
                        // 所以判断原本删除按钮（文章）数量是否只有一个
                        q.pagenum = q.pagenum === 1 ? 1 : q.pagenum - 1;
                    }

                    initTable();
                }
            })

            layer.close(index);
        });
    })
})