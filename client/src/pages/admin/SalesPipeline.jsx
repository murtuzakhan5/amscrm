import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { TrendingUp, Plus, DollarSign, Calendar, User, Shield, CheckCircle } from 'lucide-react';
import api from '../../services/api';
import { PageHeader } from '../../components/layout/PageHeader';
import { StatCard } from '../../components/common/StatCard';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';

const STAGES = [
  { key: 'qualification', title: 'Qualification', color: 'border-t-blue-500' },
  { key: 'proposal_sent', title: 'Proposal Sent', color: 'border-t-purple-500' },
  { key: 'negotiation', title: 'Negotiation', color: 'border-t-amber-500' },
  { key: 'won', title: 'Closed Won', color: 'border-t-emerald-500' },
  { key: 'lost', title: 'Closed Lost', color: 'border-t-rose-500' },
];

export const SalesPipeline = () => {
  const [deals, setDeals] = useState([]);
  const [meta, setMeta] = useState({});
  const [employees, setEmployees] = useState([]);
  const [clients, setClients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [client, setClient] = useState('');
  const [value, setValue] = useState(25000);
  const [stage, setStage] = useState('qualification');
  const [probability, setProbability] = useState(50);
  const [expectedCloseDate, setExpectedCloseDate] = useState('');
  const [owner, setOwner] = useState('');
  const [closedBy, setClosedBy] = useState('');
  const [filterAgent, setFilterAgent] = useState('all');

  const fetchDeals = async () => {
    try {
      setIsLoading(true);
      const params = {};
      if (filterAgent !== 'all') params.owner = filterAgent;
      const res = await api.get('/deals', { params });
      setDeals(res.data.data);
      setMeta(res.data.meta);
    } catch (err) {
      toast.error('Failed to load deals');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchHelpers = async () => {
    try {
      const [eRes, cRes] = await Promise.all([
        api.get('/employees?limit=100'),
        api.get('/clients?limit=100'),
      ]);
      setEmployees(eRes.data.data);
      setClients(cRes.data.data);
    } catch (err) {}
  };

  useEffect(() => {
    fetchDeals();
  }, [filterAgent]);

  useEffect(() => {
    fetchHelpers();
  }, []);

  const handleCreateDeal = async (e) => {
    e.preventDefault();
    try {
      await api.post('/deals', {
        title,
        client: client || null,
        value: Number(value),
        stage,
        probability: Number(probability),
        expectedCloseDate,
        owner,
        closedBy: stage === 'won' ? (closedBy || owner) : null,
      });
      toast.success('Deal created in pipeline');
      setIsModalOpen(false);
      setTitle('');
      setClient('');
      setValue(25000);
      setClosedBy('');
      fetchDeals();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create deal');
    }
  };

  const handleUpdateStage = async (dealId, nextStage) => {
    try {
      await api.patch(`/deals/${dealId}`, { stage: nextStage });
      toast.success(`Deal moved to ${nextStage.replace('_', ' ')}`);
      fetchDeals();
    } catch (err) {
      toast.error('Failed to update deal stage');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sales Pipeline & Revenue Forecast"
        subtitle="Track potential deal values, closing sales agents, and won revenue"
        actions={
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <select
              value={filterAgent}
              onChange={(e) => setFilterAgent(e.target.value)}
              className="px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-700 dark:text-slate-200"
            >
              <option value="all">All Sales Agents / Owners</option>
              {employees.map((emp) => (
                <option key={emp._id} value={emp._id}>
                  {emp.fullName} ({emp.designation || emp.department})
                </option>
              ))}
            </select>

            <Button
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={() => setIsModalOpen(true)}
            >
              Create Deal
            </Button>
          </div>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Pipeline Value"
          value={`$${((meta.totalDealValue || 0) / 1000).toFixed(1)}k`}
          icon={TrendingUp}
          color="blue"
          subtitle={`${meta.totalDeals || 0} active & closed deals`}
        />
        <StatCard
          title="Won Contracts Value"
          value={`$${((meta.wonDealValue || 0) / 1000).toFixed(1)}k`}
          icon={CheckCircle}
          color="green"
          subtitle="Closed won deal contracts"
        />
        <StatCard
          title="Actual Revenue Received"
          value={`$${((meta.totalActualRevenue || 0) / 1000).toFixed(1)}k`}
          icon={DollarSign}
          color="navy"
          subtitle="Real payments in bank"
        />
        <StatCard
          title="Deals Count"
          value={deals.length}
          icon={TrendingUp}
          color="purple"
          subtitle="Opportunities in CRM"
        />
      </div>

      {/* Pipeline Board */}
      <div className="flex gap-4 overflow-x-auto pb-6 select-none min-h-[550px]">
        {STAGES.map(({ key, title: stageTitle, color }) => {
          const stageDeals = deals.filter((d) => d.stage === key);
          const stageValue = stageDeals.reduce((sum, d) => sum + (d.value || 0), 0);

          return (
            <div
              key={key}
              className={`w-72 shrink-0 bg-slate-100/70 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 border-t-4 ${color} flex flex-col max-h-[75vh]`}
            >
              <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-800/40 rounded-t-xl flex items-center justify-between">
                <div>
                  <span className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-200 block">
                    {stageTitle}
                  </span>
                  <span className="text-[11px] font-extrabold text-blue-600 dark:text-blue-400">
                    ${(stageValue / 1000).toFixed(1)}k
                  </span>
                </div>
                <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-bold flex items-center justify-center">
                  {stageDeals.length}
                </span>
              </div>

              <div className="flex-1 overflow-y-auto p-2.5 space-y-2.5">
                {stageDeals.length === 0 ? (
                  <p className="text-xs text-slate-400 py-8 text-center">No deals in stage</p>
                ) : (
                  stageDeals.map((deal) => {
                    const agent = deal.closedBy || deal.owner;
                    return (
                      <div
                        key={deal._id}
                        className="p-3.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700 shadow-sm hover:shadow-md transition"
                      >
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate mb-1">
                          {deal.title}
                        </h4>
                        {deal.client && (
                          <p className="text-[11px] text-slate-500 truncate mb-2">
                            {deal.client.companyName || deal.client.name}
                          </p>
                        )}

                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                            ${(deal.value || 0).toLocaleString()}
                          </span>
                          <div className="flex items-center gap-1">
                            {deal.isDirectClosed && (
                              <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                                ⚡ Direct
                              </span>
                            )}
                            <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-full">
                              {deal.probability}% Prob
                            </span>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-100 dark:border-slate-700 flex flex-col gap-0.5 text-[10px] text-slate-500">
                          <div className="flex items-center justify-between">
                            <span>Due: {new Date(deal.expectedCloseDate).toLocaleDateString()}</span>
                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                              {agent?.fullName?.split(' ')[0] || 'User'}
                            </span>
                          </div>
                          {agent?.designation && (
                            <span className="text-[9px] text-slate-400 text-right truncate">
                              {agent.designation}
                            </span>
                          )}
                        </div>

                        {/* Quick stage advance buttons */}
                        <div className="pt-2 mt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center gap-1">
                          <select
                            value={deal.stage}
                            onChange={(e) => handleUpdateStage(deal._id, e.target.value)}
                            className="w-full text-[10px] px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300"
                          >
                            <option value="qualification">Qualification</option>
                            <option value="proposal_sent">Proposal Sent</option>
                            <option value="negotiation">Negotiation</option>
                            <option value="won">Closed Won</option>
                            <option value="lost">Closed Lost</option>
                          </select>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Deal Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Pipeline Deal"
        subtitle="Forecast sales revenue opportunity and expected closing timeline"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleCreateDeal} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Deal Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Apex FinTech Settlement Engine"
              className="w-full px-3 py-2 text-xs md:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Value (USD) *
              </label>
              <input
                type="number"
                required
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="w-full px-3 py-2 text-xs md:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Probability (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={probability}
                onChange={(e) => setProbability(e.target.value)}
                className="w-full px-3 py-2 text-xs md:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Linked Client
              </label>
              <select
                value={client}
                onChange={(e) => setClient(e.target.value)}
                className="w-full px-3 py-2 text-xs md:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white"
              >
                <option value="">No Client (Prospect)</option>
                {clients.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.companyName || c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Deal Owner *
              </label>
              <select
                required
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                className="w-full px-3 py-2 text-xs md:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white"
              >
                <option value="">Select Employee</option>
                {employees.map((emp) => (
                  <option key={emp._id} value={emp._id}>
                    {emp.fullName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Stage
              </label>
              <select
                value={stage}
                onChange={(e) => setStage(e.target.value)}
                className="w-full px-3 py-2 text-xs md:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white"
              >
                <option value="qualification">Qualification</option>
                <option value="proposal_sent">Proposal Sent</option>
                <option value="negotiation">Negotiation</option>
                <option value="won">Closed Won</option>
                <option value="lost">Closed Lost</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Closing Agent {stage === 'won' ? '*' : '(Optional)'}
              </label>
              <select
                value={closedBy}
                onChange={(e) => setClosedBy(e.target.value)}
                className="w-full px-3 py-2 text-xs md:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white"
              >
                <option value="">Default to Owner</option>
                {employees.map((emp) => (
                  <option key={emp._id} value={emp._id}>
                    {emp.fullName} ({emp.designation || emp.department})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Expected Close Date *
            </label>
            <input
              type="date"
              required
              value={expectedCloseDate}
              onChange={(e) => setExpectedCloseDate(e.target.value)}
              className="w-full px-3 py-2 text-xs md:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Add Deal
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
