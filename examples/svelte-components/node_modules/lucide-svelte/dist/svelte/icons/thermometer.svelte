<script>import Icon from '../Icon.svelte';
const iconNode = [["path", { "d": "M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z" }]];
</script>

<Icon name="thermometer" {...$$props} iconNode={iconNode}>
  <slot/>
</Icon>
