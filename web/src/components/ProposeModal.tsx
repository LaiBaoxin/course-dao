import React, { useEffect } from 'react';
import { Modal, Form, Input, InputNumber, message } from 'antd';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { governanceABI } from '../api/governance.ts';
import { parseEther } from 'viem';

const CONTRACT_ADDRESS = '0x3761b1F7f037318C018Ba5C5D473Ea92799B4Db5' as `0x${string}`;

interface ProposeModalProps {
    visible: boolean;
    onCancel: () => void;
    onSuccess: () => void;
}

const ProposeModal: React.FC<ProposeModalProps> = ({ visible, onCancel, onSuccess }) => {
    const [form] = Form.useForm();

    // 发起合约写入
    const { writeContract, data: hash, isPending, error: writeError } = useWriteContract();

    // 监听交易回执
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
        hash,
    });

    // 当交易真正成功时，触发回调
    useEffect(() => {
        if (isSuccess) {
            message.success("提案已成功写入区块链！");
            form.resetFields();
            onSuccess(); // 通知父组件刷新列表
        }
    }, [isSuccess, form, onSuccess]);

    // 监听错误提示
    useEffect(() => {
        if (writeError) {
            message.error(`发起失败: ${writeError.message.split('\n')[0]}`);
        }
    }, [writeError]);

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            const amountInWei = parseEther(values.amount.toString());

            writeContract({
                address: CONTRACT_ADDRESS,
                abi: governanceABI,
                functionName: 'propose',
                args: [
                    values.description,
                    amountInWei,
                    values.receiver as `0x${string}`
                ],
            });
        } catch (error) {
            console.error("表单验证失败:", error);
        }
    };

    return (
        <Modal
            title="发起新治理提案"
            open={visible}
            onOk={handleSubmit}
            onCancel={onCancel}
            confirmLoading={isPending || isConfirming}
            okText={isConfirming ? "正在上链..." : "提交至区块链"}
            cancelText="取消"
        >
            <Form form={form} layout="vertical" className="mt-4">
                <Form.Item
                    name="description"
                    label="提案描述"
                    rules={[{ required: true, message: '请输入提案描述' }]}
                >
                    <Input.TextArea
                        placeholder="说明提案的用途..."
                        rows={3}
                        disabled={isPending || isConfirming}
                    />
                </Form.Item>

                <Form.Item
                    name="amount"
                    label="申请金额 (Wei)"
                    rules={[{ required: true, message: '请输入金额' }]}
                >
                    <InputNumber
                        className="w-full"
                        placeholder="例如：100"
                        min={1}
                        disabled={isPending || isConfirming}
                    />
                </Form.Item>

                <Form.Item
                    name="receiver"
                    label="收款人地址"
                    rules={[
                        { required: true, message: '请输入收款人钱包地址' },
                        { pattern: /^0x[a-fA-F0-9]{40}$/, message: '请输入有效的以太坊地址' }
                    ]}
                >
                    <Input
                        placeholder="0x..."
                        disabled={isPending || isConfirming}
                    />
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default ProposeModal;
