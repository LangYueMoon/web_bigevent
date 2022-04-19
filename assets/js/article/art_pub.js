$(function() {
    var layer = layui.layer;
    var form = layui.form;

    // 渲染下拉菜单
    initCate();

    // 初始化富文本编辑器
    initEditor();

    // 定义加载文章分类的方法
    function initCate() {
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
                // 必须记住：需要手动调用 form.render() 方法重新渲染下拉菜单
                form.render();
            }
        })
    }

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

    // 为选择封面按钮绑定 click 事件
    $('#btnChooseImage').on('click', function() {
        $('#coverFile').click();
    })

    // 监听 coverFile 的 change 事件，获取用户选择的文件列表
    $('#coverFile').on('change', function(e) {
        // 获取文件列表的列表数组
        var files = e.target.files;
        // 判断用户是否已选择文件
        if (files.length === 0) {
            return layer.msg('请选择文件')
        }
        // 根据文件，创建对应的 URL 地址
        var newImgURL = URL.createObjectURL(files[0]);
        // 为裁剪区域重新设置图片
        $image
            .cropper('destroy') // 销毁旧的裁剪区域
            .attr('src', newImgURL) // 重新设置图片路径
            .cropper(options) // 重新初始化裁剪区域
    })

    var art_state = '已发布';

    $('#btnSaveDraft').on('click', function() {
        art_state = '草稿';
    })

    // 为表单绑定 submit 事件
    $('#form-pub').on('submit', function(e) {
        e.preventDefault();

        // 基于 form 表单，快速创建 FormData 对象
        var fd = new FormData($(this)[0]);
        fd.append('state', art_state);

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
                publishArticle(fd);
            })
    })

    // 定义发布文章的方法
    function publishArticle(fd) {
        $.ajax({
            url: '/my/article/add',
            method: 'POST',
            data: fd,
            // 注意如果向服务器提交 FormData 格式数据
            contentType: false,
            processData: false,
            success: function(res) {
                if (res.status !== 0) {
                    return layer.msg('发布文章失败');
                }
                layer.msg('发布文章成功');
                location.href = '../../../otherHTML/article/art_list.html';
            }
        })
    }
})