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
    initCateList();

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
    function initCateList() {
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

    // 分界线 ----------------------------------------------------------------

    function initCateEdit(cateId) {
        $.ajax({
            url: '/my/article/cates',
            method: 'GET',
            success: function(res) {
                if (res.status !== 0) {
                    return layer.msg('加载文章分类失败')
                }
                // 调用模板引擎渲染下拉菜单
                var htmlStr = template('tpl-cate', res);
                $('[name="cate_id"]').html(htmlStr);
                $('[name="cate_id"]').val(cateId);
                // 必须记住：需要手动调用 form.render() 方法重新渲染下拉菜单
                form.render();
            }
        })
    }

    // 为选择封面按钮绑定 click 事件
    $('.area-edit').on('click', '#btnChooseImage', function() {
        $('#coverFile').click();
    })

    // 监听 coverFile 的 change 事件，获取用户选择的文件列表
    $('.area-edit').on('change', '#coverFile', function(e) {
        console.log('OK');
        // 获取文件列表的列表数组
        var files = e.target.files;
        // 判断用户是否已选择文件
        if (files.length === 0) {
            return layer.msg('请选择文件')
        }
        // 根据文件，创建对应的 URL 地址
        var newImgURL = URL.createObjectURL(files[0]);
        // 1.1 获取裁剪区域的 DOM 元素
        var $image = $('#image');
        // 1.2 配置选项
        const options = {
            // 纵横比
            aspectRatio: 400 / 280,
            // 指定预览区域
            preview: '.img-preview',
            // 对裁剪图片限制部分缩放和移动
            viewMode: 2,
            // 图片不可缩放（焦距）
            zoomable: false
        };
        // 1.3 为裁剪区域重新设置图片
        $image
            .cropper('destroy') // 销毁旧的裁剪区域
            .attr('src', newImgURL) // 重新设置图片路径
            .cropper(options) // 重新初始化裁剪区域
    })

    // 通过事件代理，为编辑按钮绑定 click 事件
    $('tbody').on('click', '.btn-edit', function() {
        var Id = $(this).attr('data-id');
        $.ajax({
            url: '/my/article/' + Id,
            method: 'GET',
            success: function(res) {
                if (res.status !== 0) {
                    return layer.msg('预修改文章失败');
                }
                res.data.cover_img = 'http://127.0.0.1:5005' + res.data.cover_img;
                var htmlStr = template('tpl-edit', res.data);
                $('.area-edit').html(htmlStr);

                // 渲染下拉菜单
                initCateEdit(res.data.cate_id);

                // 初始化富文本编辑器
                initEditor();

                // 1.1 获取裁剪区域的 DOM 元素
                var $image = $('#image');
                // 1.2 配置选项
                const options = {
                    // 纵横比
                    aspectRatio: 400 / 280,
                    // 指定预览区域
                    preview: '.img-preview',
                    // 对裁剪图片限制部分缩放和移动
                    viewMode: 2,
                    // 图片不可缩放（焦距）
                    zoomable: false
                };
                // 1.3 创建裁剪区域
                $image.cropper(options)
            }
        })
    })

    var art_state = '已发布';

    $('.area-edit').on('click', '#btnSaveDraft', function() {
        art_state = '草稿';
    })

    $('.area-edit').on('submit', '#form-edit', function(e) {
        e.preventDefault();

        // 基于 form 表单，快速创建 FormData 对象
        var fd = new FormData($(this)[0]);
        fd.append('state', art_state);

        // 获取裁剪区域的 DOM 元素
        var $image = $('#image');

        // 将裁减后的封面输出为一个文件对象
        $image
            .cropper('getCroppedCanvas', {
                // 创建一个 Canvas 画布
                width: 400,
                height: 280
            })
            .toBlob(function(blob) {
                // 将 Canvas 画布上的内容，转化为文件对象
                // 得到文件对象后，进行后续的操作
                fd.append('cover_img', blob);

                // 发起 ajax 数据请求
                editArticle(fd);
            })
    })

    // 修改发布文章的方法
    function editArticle(fd) {
        fd.forEach((value, key) => {
            console.log(`key ${key}: value ${value}`);
        })

        $.ajax({
            url: '/my/article/edit',
            method: 'POST',
            data: fd,
            // 注意如果向服务器提交 FormData 格式数据
            contentType: false,
            processData: false,
            success: function(res) {
                if (res.status !== 0) {
                    console.log(res.message);
                    return layer.msg('修改文章失败');
                }
                layer.msg('修改文章成功');
                location.href = '../../../otherHTML/article/art_list.html';
            }
        })
    }
})