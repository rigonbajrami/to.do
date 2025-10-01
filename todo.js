// Todo List Application
class TodoApp {
    constructor() {
        this.todos = JSON.parse(localStorage.getItem('todos')) || [];
        this.filter = 'all'; // all, active, completed
        this.init();
    }

    init() {
        this.bindEvents();
        this.render();
    }

    bindEvents() {
        // Add todo
        document.getElementById('addTodoBtn').addEventListener('click', () => this.addTodo());
        document.getElementById('todoInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTodo();
        });

        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.setFilter(e.target.dataset.filter));
        });

        // Clear completed
        document.getElementById('clearCompleted').addEventListener('click', () => this.clearCompleted());
    }

    addTodo() {
        const input = document.getElementById('todoInput');
        const text = input.value.trim();
        
        if (text === '') {
            this.showNotification('Please enter a todo item!', 'error');
            return;
        }

        const todo = {
            id: Date.now(),
            text: text,
            completed: false,
            createdAt: new Date().toISOString()
        };

        this.todos.unshift(todo);
        this.saveTodos();
        this.render();
        input.value = '';
        
        this.showNotification('Todo added successfully!', 'success');
    }

    toggleTodo(id) {
        const todo = this.todos.find(t => t.id === id);
        if (todo) {
            todo.completed = !todo.completed;
            this.saveTodos();
            this.render();
        }
    }

    deleteTodo(id) {
        this.todos = this.todos.filter(t => t.id !== id);
        this.saveTodos();
        this.render();
        this.showNotification('Todo deleted!', 'info');
    }

    editTodo(id, newText) {
        const todo = this.todos.find(t => t.id === id);
        if (todo && newText.trim() !== '') {
            todo.text = newText.trim();
            this.saveTodos();
            this.render();
            this.showNotification('Todo updated!', 'success');
        }
    }

    setFilter(filter) {
        this.filter = filter;
        
        // Update active filter button
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-filter="${filter}"]`).classList.add('active');
        
        this.render();
    }

    clearCompleted() {
        const completedCount = this.todos.filter(t => t.completed).length;
        this.todos = this.todos.filter(t => !t.completed);
        this.saveTodos();
        this.render();
        
        if (completedCount > 0) {
            this.showNotification(`Cleared ${completedCount} completed todos!`, 'info');
        }
    }

    getFilteredTodos() {
        switch (this.filter) {
            case 'active':
                return this.todos.filter(t => !t.completed);
            case 'completed':
                return this.todos.filter(t => t.completed);
            default:
                return this.todos;
        }
    }

    render() {
        const todoList = document.getElementById('todoList');
        const emptyState = document.getElementById('emptyState');
        const todoCount = document.getElementById('todoCount');
        const clearBtn = document.getElementById('clearCompleted');
        
        const filteredTodos = this.getFilteredTodos();
        const activeTodos = this.todos.filter(t => !t.completed);
        
        // Update stats
        todoCount.textContent = `${activeTodos.length} item${activeTodos.length !== 1 ? 's' : ''} left`;
        clearBtn.style.display = this.todos.some(t => t.completed) ? 'block' : 'none';
        
        // Show/hide empty state
        if (filteredTodos.length === 0) {
            todoList.style.display = 'none';
            emptyState.style.display = 'block';
            emptyState.innerHTML = this.getEmptyStateMessage();
        } else {
            todoList.style.display = 'block';
            emptyState.style.display = 'none';
        }
        
        // Render todos
        todoList.innerHTML = filteredTodos.map(todo => `
            <li class="todo-item ${todo.completed ? 'completed' : ''}" data-id="${todo.id}">
                <div class="todo-content">
                    <input type="checkbox" class="todo-checkbox" ${todo.completed ? 'checked' : ''}>
                    <span class="todo-text">${this.escapeHtml(todo.text)}</span>
                    <input type="text" class="todo-edit-input" value="${this.escapeHtml(todo.text)}" style="display: none;">
                </div>
                <div class="todo-actions">
                    <button class="edit-btn" title="Edit">✏️</button>
                    <button class="delete-btn" title="Delete">🗑️</button>
                </div>
            </li>
        `).join('');
        
        // Bind events for each todo item
        this.bindTodoEvents();
    }

    bindTodoEvents() {
        document.querySelectorAll('.todo-item').forEach(item => {
            const id = parseInt(item.dataset.id);
            
            // Checkbox toggle
            item.querySelector('.todo-checkbox').addEventListener('change', () => {
                this.toggleTodo(id);
            });
            
            // Edit functionality
            const editBtn = item.querySelector('.edit-btn');
            const textSpan = item.querySelector('.todo-text');
            const editInput = item.querySelector('.todo-edit-input');
            
            editBtn.addEventListener('click', () => {
                textSpan.style.display = 'none';
                editInput.style.display = 'block';
                editInput.focus();
                editInput.select();
            });
            
            editInput.addEventListener('blur', () => {
                this.editTodo(id, editInput.value);
            });
            
            editInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.editTodo(id, editInput.value);
                } else if (e.key === 'Escape') {
                    editInput.value = textSpan.textContent;
                    textSpan.style.display = 'block';
                    editInput.style.display = 'none';
                }
            });
            
            // Delete functionality
            item.querySelector('.delete-btn').addEventListener('click', () => {
                if (confirm('Are you sure you want to delete this todo?')) {
                    this.deleteTodo(id);
                }
            });
        });
    }

    getEmptyStateMessage() {
        switch (this.filter) {
            case 'active':
                return '<p>🎯 No active todos! Great job!</p>';
            case 'completed':
                return '<p>📝 No completed todos yet. Start checking some off!</p>';
            default:
                return '<p>🎉 No todos yet! Add one above to get started.</p>';
        }
    }

    saveTodos() {
        localStorage.setItem('todos', JSON.stringify(this.todos));
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showNotification(message, type = 'info') {
        // Remove existing notification
        const existing = document.querySelector('.notification');
        if (existing) existing.remove();
        
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new TodoApp();
});

// Add some keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + Enter to focus input
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        const input = document.getElementById('todoInput');
        if (input) input.focus();
    }
    
    // Escape to clear input
    if (e.key === 'Escape') {
        const input = document.getElementById('todoInput');
        if (input) input.value = '';
    }
});
