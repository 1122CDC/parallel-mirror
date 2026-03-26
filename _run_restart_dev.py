import subprocess
import os

def run():
    print("正在启动 Vite 开发服务器...")
    # 使用 Popen 异步启动，防止阻塞当前进程
    # shell=True 在 Windows 下处理 npm 这种命令更稳妥
    # 切换到 vite_app 目录并在后台运行
    process = subprocess.Popen(
        ['npm', 'run', 'dev'],
        cwd=r'E:\hmw\vite_app',
        shell=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL
    )
    print(f"Vite 服务启动指令已发出 (PID: {process.pid})，请大哥稍后刷新浏览器。")
    return 0

if __name__ == "__main__":
    run()
