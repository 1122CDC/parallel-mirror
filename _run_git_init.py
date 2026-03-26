import subprocess
import os

def run():
    commands = [
        ['git', 'init'],
        ['git', 'add', '.'],
        ['git', 'commit', '-m', 'feat: HELLO MY WORLD V8.3 - 维度档案 & AI 链路正式打通']
    ]
    
    for cmd in commands:
        print(f"执行: {' '.join(cmd)}")
        res = subprocess.run(cmd, cwd=r'E:\hmw\vite_app', shell=True)
        if res.returncode != 0:
            print("Git 操作失败")
            return res.returncode
            
    print("Git 初始化并提交成功！")
    return 0

if __name__ == "__main__":
    run()
