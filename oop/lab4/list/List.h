#include <functional>

#ifndef LIST_H
#define LIST_H

template <typename T>
class List;

template <typename T>
class Node {
    friend class List<T>;

private:
    T data;
    Node<T> *prev;
    Node<T> *next;

    Node();
    Node(const T&, Node<T>*, Node<T>*);
};

template <typename T>
class List {
public:
    List();
    ~List();

    int size();
    void push_back(const T&);
    void sort(std::function<bool(const T&, const T&)>);

private:
    void insert_before(Node<T>*, const T&);
    void swap_data(Node<T>* first, Node<T>* second);

    Node<T>* sentinel;
    int size_;
};

template <typename T>
Node<T>::Node() {
    prev = this;
    next = this;
}

template <typename T>
Node<T>::Node(const T& data, Node<T>* prev, Node<T>* next) :
        data{data}, prev{prev}, next{next} {}

template <typename T>
List<T>::List() {
    sentinel = new Node<T>();
    size_ = 0;
}

template <typename T>
List<T>::~List() {
    Node<T>* node = sentinel->next;
    Node<T>* temp;
    while (node != sentinel) {
        temp = node->next;
        delete node;
        node = temp;
    }

    delete sentinel;
}

template <typename T>
int List<T>::size() {
    return size_;
}

template <typename T>
void List<T>::insert_before(Node<T>* next, const T& data) {
    Node<T>* node = new Node<T>(data, next->prev, next);
    next->prev->next = node;
    next->prev = node;
    size_++;
}

template <typename T>
void List<T>::push_back(const T& data) {
    insert_before(sentinel, data);
}

template <typename T>
void List<T>::swap_data(Node<T>* first, Node<T>* second) {
    T temp_data = first->data;
    first->data = second->data;
    second->data = temp_data;
}

template <typename T>
void List<T>::sort(std::function<bool(const T&, const T&)> cmp) {
    Node<T>* first = sentinel->next;

    while (first != sentinel) {
        Node<T>* second = first->next;

        while (second != sentinel) {
            if (!cmp(first->data, second->data)) {
                swap_data(first, second);
            }

            second = second->next;
        }

        first = first->next;
    }
}

#endif // LIST_H
